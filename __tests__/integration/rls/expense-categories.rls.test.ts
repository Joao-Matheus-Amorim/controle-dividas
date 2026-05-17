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

describe("expense_categories RLS gated integration", () => {
  it("is disabled unless RUN_RLS_TESTS=true and all RLS_TEST variables are set", () => {
    if (runRlsTests) {
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(runRlsTests).toBe(false);
  });

  rlsIt("isolates expense categories between authenticated users", async () => {
    const fixture = createExpenseCategoryFixtureSet();

    const serviceClient = createClient(
      config.supabaseUrl!,
      config.serviceRoleKey!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const userAClient = createClient(
      config.supabaseUrl!,
      config.anonKey!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const userBClient = createClient(
      config.supabaseUrl!,
      config.anonKey!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: userASession, error: userAError } = await userAClient.auth.signInWithPassword({
      email: config.userAEmail!,
      password: config.userAPassword!,
    });

    if (userAError || !userASession.user) {
      throw userAError ?? new Error("Unable to sign in RLS user A.");
    }

    const { data: userBSession, error: userBError } = await userBClient.auth.signInWithPassword({
      email: config.userBEmail!,
      password: config.userBPassword!,
    });

    if (userBError || !userBSession.user) {
      throw userBError ?? new Error("Unable to sign in RLS user B.");
    }

    const userAId = userASession.user.id;
    const userBId = userBSession.user.id;

    try {
      const { error: orgError } = await serviceClient.from("organizations").insert([
        {
          id: fixture.organizations.organizationA.id,
          slug: fixture.organizations.organizationA.slug,
          name: fixture.organizations.organizationA.name,
          owner_auth_user_id: userAId,
        },
        {
          id: fixture.organizations.organizationB.id,
          slug: fixture.organizations.organizationB.slug,
          name: fixture.organizations.organizationB.name,
          owner_auth_user_id: userBId,
        },
      ]);

      if (orgError) {
        throw orgError;
      }

      const { error: membershipError } = await serviceClient.from("organization_memberships").insert([
        {
          organization_id: fixture.organizations.organizationA.id,
          auth_user_id: userAId,
          role: "owner",
          is_active: true,
        },
        {
          organization_id: fixture.organizations.organizationB.id,
          auth_user_id: userBId,
          role: "owner",
          is_active: true,
        },
      ]);

      if (membershipError) {
        throw membershipError;
      }

      const { error: categoryError } = await serviceClient.from("expense_categories").insert([
        {
          id: fixture.categories.categoryA.id,
          owner_id: userAId,
          organization_id: fixture.organizations.organizationA.id,
          name: fixture.categories.categoryA.name,
          description: fixture.categories.categoryA.description,
          is_default: fixture.categories.categoryA.isDefault,
        },
        {
          id: fixture.categories.categoryB.id,
          owner_id: userBId,
          organization_id: fixture.organizations.organizationB.id,
          name: fixture.categories.categoryB.name,
          description: fixture.categories.categoryB.description,
          is_default: fixture.categories.categoryB.isDefault,
        },
        {
          id: fixture.categories.legacyCategoryA.id,
          owner_id: userAId,
          organization_id: null,
          name: fixture.categories.legacyCategoryA.name,
          description: fixture.categories.legacyCategoryA.description,
          is_default: fixture.categories.legacyCategoryA.isDefault,
        },
      ]);

      if (categoryError) {
        throw categoryError;
      }

      const { data: userACategories, error: userACategoriesError } = await userAClient
        .from("expense_categories")
        .select("id, name, organization_id")
        .in("id", [
          fixture.categories.categoryA.id,
          fixture.categories.categoryB.id,
          fixture.categories.legacyCategoryA.id,
        ])
        .order("name", { ascending: true });

      if (userACategoriesError) {
        throw userACategoriesError;
      }

      expect(userACategories?.map((category) => category.id).sort()).toEqual([
        fixture.categories.categoryA.id,
        fixture.categories.legacyCategoryA.id,
      ].sort());

      const { data: userBCategories, error: userBCategoriesError } = await userBClient
        .from("expense_categories")
        .select("id, name, organization_id")
        .in("id", [
          fixture.categories.categoryA.id,
          fixture.categories.categoryB.id,
          fixture.categories.legacyCategoryA.id,
        ])
        .order("name", { ascending: true });

      if (userBCategoriesError) {
        throw userBCategoriesError;
      }

      expect(userBCategories?.map((category) => category.id)).toEqual([
        fixture.categories.categoryB.id,
      ]);
    } finally {
      await serviceClient
        .from("expense_categories")
        .delete()
        .in("id", [
          fixture.categories.categoryA.id,
          fixture.categories.categoryB.id,
          fixture.categories.legacyCategoryA.id,
        ]);

      await serviceClient
        .from("organization_memberships")
        .delete()
        .in("organization_id", [
          fixture.organizations.organizationA.id,
          fixture.organizations.organizationB.id,
        ]);

      await serviceClient
        .from("organizations")
        .delete()
        .in("id", [
          fixture.organizations.organizationA.id,
          fixture.organizations.organizationB.id,
        ]);

      await userAClient.auth.signOut();
      await userBClient.auth.signOut();
    }
  });
});
