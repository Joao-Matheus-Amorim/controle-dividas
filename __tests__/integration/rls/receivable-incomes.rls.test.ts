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

describe("receivable_incomes RLS gated integration", () => {
  it("is disabled unless RUN_RLS_TESTS=true and all RLS_TEST variables are set", () => {
    if (config.enabled) {
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(runRlsTests).toBe(false);
  });

  rlsIt("returns only incomes for the active organization", async () => {
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

    const incomeAId = crypto.randomUUID();
    const incomeBId = crypto.randomUUID();
    const secondIncomeAId = crypto.randomUUID();

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

      const incomeResult = await admin.from("receivable_incomes").insert([
        {
          id: incomeAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          receiver_member_id: memberAId,
          source: `${fixture.prefix} Income A`,
          income_type: "fixa",
          amount: 10,
          expected_date: "2026-05-17",
          status: "previsto",
        },
        {
          id: incomeBId,
          owner_id: ownerId,
          organization_id: orgB.id,
          receiver_member_id: memberBId,
          source: `${fixture.prefix} Income B`,
          income_type: "fixa",
          amount: 20,
          expected_date: "2026-05-17",
          status: "previsto",
        },
        {
          id: secondIncomeAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          receiver_member_id: memberAId,
          source: `${fixture.prefix} Income A2`,
          income_type: "fixa",
          amount: 30,
          expected_date: "2026-05-17",
          status: "previsto",
        },
      ]);

      if (incomeResult.error) throw incomeResult.error;

      const ids = [incomeAId, incomeBId, secondIncomeAId];

      const result = await user
        .from("receivable_incomes")
        .select("id")
        .in("id", ids);

      if (result.error) throw result.error;

      expect(result.data?.map((row) => row.id).sort()).toEqual(
        [incomeAId, secondIncomeAId].sort(),
      );
    } finally {
      await admin
        .from("receivable_incomes")
        .delete()
        .in("id", [incomeAId, incomeBId, secondIncomeAId]);

      await admin.from("family_members").delete().in("id", [memberAId, memberBId]);

      await admin
        .from("organization_memberships")
        .delete()
        .in("organization_id", [orgA.id, orgB.id]);

      await admin.from("organizations").delete().in("id", [orgA.id, orgB.id]);

      await user.auth.signOut();
    }
  }, 30000);
});
