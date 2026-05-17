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

describe("category owner scope", () => {
  it("uses the gated environment", () => {
    expect(runRlsTests ? config.missingVariables : []).toEqual([]);
  });

  rlsIt("returns only rows for the active organization plus legacy rows", async () => {
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

    const userId = login.data.user.id;

    const orgA = fixture.organizations.organizationA;
    const orgB = fixture.organizations.organizationB;
    const catA = fixture.categories.categoryA;
    const catB = fixture.categories.categoryB;
    const legacy = fixture.categories.legacyCategoryA;

    try {
      const orgResult = await admin.from("organizations").insert([
        {
          id: orgA.id,
          slug: orgA.slug,
          name: orgA.name,
          owner_auth_user_id: userId,
        },
        {
          id: orgB.id,
          slug: orgB.slug,
          name: orgB.name,
          owner_auth_user_id: userId,
        },
      ]);

      if (orgResult.error) throw orgResult.error;

      const memberResult = await admin.from("organization_memberships").insert({
        organization_id: orgA.id,
        auth_user_id: userId,
        role: "owner",
        is_active: true,
      });

      if (memberResult.error) throw memberResult.error;

      const categoryResult = await admin.from("expense_categories").insert([
        {
          id: catA.id,
          owner_id: userId,
          organization_id: orgA.id,
          name: catA.name,
          description: catA.description,
          is_default: false,
        },
        {
          id: catB.id,
          owner_id: userId,
          organization_id: orgB.id,
          name: catB.name,
          description: catB.description,
          is_default: false,
        },
        {
          id: legacy.id,
          owner_id: userId,
          organization_id: null,
          name: legacy.name,
          description: legacy.description,
          is_default: false,
        },
      ]);

      if (categoryResult.error) throw categoryResult.error;

      const ids = [catA.id, catB.id, legacy.id];

      const result = await user
        .from("expense_categories")
        .select("id")
        .in("id", ids);

      if (result.error) throw result.error;

      expect(result.data?.map((row) => row.id).sort()).toEqual(
        [catA.id, legacy.id].sort(),
      );
    } finally {
      await admin
        .from("expense_categories")
        .delete()
        .in("id", [catA.id, catB.id, legacy.id]);

      await admin
        .from("organization_memberships")
        .delete()
        .in("organization_id", [orgA.id, orgB.id]);

      await admin.from("organizations").delete().in("id", [orgA.id, orgB.id]);

      await user.auth.signOut();
    }
  });
});