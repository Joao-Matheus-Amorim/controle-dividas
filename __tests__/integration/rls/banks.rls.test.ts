import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  createExpenseCategoryFixtureSet,
  getRlsTestConfig,
  shouldRunRlsTests,
} from "./helpers";

const config = getRlsTestConfig();
const runRlsTests = shouldRunRlsTests();
const rlsIt = runRlsTests ? it : it.skip;

describe("banks RLS gated integration", () => {
  it("is disabled unless RUN_RLS_TESTS=true and all RLS_TEST variables are set", () => {
    if (config.enabled) {
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(runRlsTests).toBe(false);
  });

  rlsIt("returns only bank accounts for the active organization", async () => {
    const fixture = createExpenseCategoryFixtureSet();

    const admin = createClient(config.supabaseUrl!, config.serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const user = createClient(config.supabaseUrl!, config.anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const login = await user.auth.signInWithPassword({
      email: config.userAEmail!,
      password: config.userAPassword!,
    });

    if (login.error || !login.data.user) {
      throw login.error ?? new Error("login failed");
    }

    const ownerId = login.data.user.id;
    const orgA = fixture.organizations.organizationA;
    const orgB = fixture.organizations.organizationB;

    const memberAId = crypto.randomUUID();
    const memberBId = crypto.randomUUID();

    const bankAId = crypto.randomUUID();
    const bankBId = crypto.randomUUID();
    const secondBankAId = crypto.randomUUID();

    try {
      const orgResult = await admin.from("organizations").insert([
        {
          id: orgA.id,
          slug: orgA.slug,
          name: orgA.name,
          owner_auth_user_id: ownerId,
        },
        {
          id: orgB.id,
          slug: orgB.slug,
          name: orgB.name,
          owner_auth_user_id: ownerId,
        },
      ]);

      if (orgResult.error) throw orgResult.error;

      const membershipResult = await admin
        .from("organization_memberships")
        .insert({
          organization_id: orgA.id,
          auth_user_id: ownerId,
          role: "owner",
          is_active: true,
        });

      if (membershipResult.error) throw membershipResult.error;

      const memberResult = await admin.from("family_members").insert([
        {
          id: memberAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          name: `${fixture.prefix} Member A`,
          role: "adult",
          monthly_limit: 100,
          currency: "EUR",
          is_active: false,
        },
        {
          id: memberBId,
          owner_id: ownerId,
          organization_id: orgB.id,
          name: `${fixture.prefix} Member B`,
          role: "adult",
          monthly_limit: 100,
          currency: "EUR",
          is_active: true,
        },
      ]);

      if (memberResult.error) throw memberResult.error;

      const bankResult = await admin.from("banks").insert([
        {
          id: bankAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          family_member_id: memberAId,
          bank_name: `${fixture.prefix} Bank A`,
          account_type: "corrente",
          current_balance: 10,
          currency: "EUR",
        },
        {
          id: bankBId,
          owner_id: ownerId,
          organization_id: orgB.id,
          family_member_id: memberBId,
          bank_name: `${fixture.prefix} Bank B`,
          account_type: "corrente",
          current_balance: 20,
          currency: "EUR",
        },
        {
          id: secondBankAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          family_member_id: memberAId,
          bank_name: `${fixture.prefix} Bank A2`,
          account_type: "corrente",
          current_balance: 30,
          currency: "EUR",
        },
      ]);

      if (bankResult.error) throw bankResult.error;

      const ids = [bankAId, bankBId, secondBankAId];

      const result = await user.from("banks").select("id").in("id", ids);

      if (result.error) throw result.error;

      expect(result.data?.map((row) => row.id).sort()).toEqual(
        [bankAId, secondBankAId].sort(),
      );
    } finally {
      await admin
        .from("banks")
        .delete()
        .in("id", [bankAId, bankBId, secondBankAId]);

      await admin.from("family_members").delete().in("id", [memberAId, memberBId]);

      await admin
        .from("organization_memberships")
        .delete()
        .in("organization_id", [orgA.id, orgB.id]);

      await admin.from("organizations").delete().in("id", [orgA.id, orgB.id]);

      await user.auth.signOut();
    }
  });
});
