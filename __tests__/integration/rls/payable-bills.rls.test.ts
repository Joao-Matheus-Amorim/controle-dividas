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

describe("payable_bills RLS gated integration", () => {
  it("is disabled unless RUN_RLS_TESTS=true and all RLS_TEST variables are set", () => {
    if (config.enabled) {
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(runRlsTests).toBe(false);
  });

  rlsIt("hides bills from another organization when owner_id is the same", async () => {
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

    const billAId = crypto.randomUUID();
    const billBId = crypto.randomUUID();
    const legacyBillId = crypto.randomUUID();

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
          is_active: true,
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

      const billResult = await admin.from("payable_bills").insert([
        {
          id: billAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          name: `${fixture.prefix} Bill A`,
          amount: 10,
          due_date: "2026-05-17",
          responsible_member_id: memberAId,
          status: "pendente",
          bill_type: "avulsa",
        },
        {
          id: billBId,
          owner_id: ownerId,
          organization_id: orgB.id,
          name: `${fixture.prefix} Bill B`,
          amount: 20,
          due_date: "2026-05-17",
          responsible_member_id: memberBId,
          status: "pendente",
          bill_type: "avulsa",
        },
        {
          id: legacyBillId,
          owner_id: ownerId,
          organization_id: null,
          name: `${fixture.prefix} Legacy Bill`,
          amount: 30,
          due_date: "2026-05-17",
          responsible_member_id: memberAId,
          status: "pendente",
          bill_type: "avulsa",
        },
      ]);

      if (billResult.error) throw billResult.error;

      const ids = [billAId, billBId, legacyBillId];

      const result = await user.from("payable_bills").select("id").in("id", ids);

      if (result.error) throw result.error;

      expect(result.data?.map((row) => row.id).sort()).toEqual(
        [billAId, legacyBillId].sort(),
      );
    } finally {
      await admin
        .from("payable_bills")
        .delete()
        .in("id", [billAId, billBId, legacyBillId]);

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