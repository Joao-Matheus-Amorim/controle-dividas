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

describe("expenses RLS gated integration", () => {
  it("is gated by the dedicated RLS environment", () => {
    expect(runRlsTests ? config.missingVariables : []).toEqual([]);
  });

  rlsIt("hides expenses from another organization when owner_id is the same", async () => {
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
    const categoryAId = crypto.randomUUID();
    const categoryBId = crypto.randomUUID();
    const expenseAId = crypto.randomUUID();
    const expenseBId = crypto.randomUUID();
    const legacyExpenseId = crypto.randomUUID();

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

      const categoryResult = await admin.from("expense_categories").insert([
        {
          id: categoryAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          name: `${fixture.prefix} Category A`,
          is_default: false,
        },
        {
          id: categoryBId,
          owner_id: ownerId,
          organization_id: orgB.id,
          name: `${fixture.prefix} Category B`,
          is_default: false,
        },
      ]);

      if (categoryResult.error) throw categoryResult.error;

      const expenseResult = await admin.from("expenses").insert([
        {
          id: expenseAId,
          owner_id: ownerId,
          organization_id: orgA.id,
          family_member_id: memberAId,
          category_id: categoryAId,
          expense_date: "2026-05-17",
          description: `${fixture.prefix} Expense A`,
          amount: 10,
        },
        {
          id: expenseBId,
          owner_id: ownerId,
          organization_id: orgB.id,
          family_member_id: memberBId,
          category_id: categoryBId,
          expense_date: "2026-05-17",
          description: `${fixture.prefix} Expense B`,
          amount: 20,
        },
        {
          id: legacyExpenseId,
          owner_id: ownerId,
          organization_id: null,
          family_member_id: memberAId,
          category_id: categoryAId,
          expense_date: "2026-05-17",
          description: `${fixture.prefix} Legacy Expense`,
          amount: 30,
        },
      ]);

      if (expenseResult.error) throw expenseResult.error;

      const ids = [expenseAId, expenseBId, legacyExpenseId];

      const result = await user.from("expenses").select("id").in("id", ids);

      if (result.error) throw result.error;

      expect(result.data?.map((row) => row.id).sort()).toEqual(
        [expenseAId, legacyExpenseId].sort(),
      );
    } finally {
      await admin
        .from("expenses")
        .delete()
        .in("id", [expenseAId, expenseBId, legacyExpenseId]);

      await admin
        .from("expense_categories")
        .delete()
        .in("id", [categoryAId, categoryBId]);

      await admin
        .from("family_members")
        .delete()
        .in("id", [memberAId, memberBId]);

      await admin
        .from("organization_memberships")
        .delete()
        .in("organization_id", [orgA.id, orgB.id]);

      await admin.from("organizations").delete().in("id", [orgA.id, orgB.id]);

      await user.auth.signOut();
    }
  });
});