import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { createExpenseCategoryFixtureSet, getRlsTestConfig, shouldRunRlsTests } from "./helpers";

const config = getRlsTestConfig();
const runRlsTests = shouldRunRlsTests();
const rlsIt = runRlsTests ? it : it.skip;

describe("family_members RLS gated integration", () => {
  it("is gated by the dedicated RLS environment", () => {
    expect(runRlsTests ? config.missingVariables : []).toEqual([]);
  });

  rlsIt("hides members from another organization when owner_id is the same", async () => {
    const fixture = createExpenseCategoryFixtureSet();
    const admin = createClient(config.supabaseUrl!, config.serviceRoleKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    const user = createClient(config.supabaseUrl!, config.anonKey!, { auth: { autoRefreshToken: false, persistSession: false } });
    const login = await user.auth.signInWithPassword({ email: config.userAEmail!, password: config.userAPassword! });
    if (login.error || !login.data.user) throw login.error ?? new Error("login failed");

    const ownerId = login.data.user.id;
    const orgA = fixture.organizations.organizationA;
    const orgB = fixture.organizations.organizationB;
    const memberAId = crypto.randomUUID();
    const memberBId = crypto.randomUUID();
    const legacyMemberId = crypto.randomUUID();
    const memberIds = [memberAId, memberBId, legacyMemberId];
    const orgIds = [orgA.id, orgB.id];

    try {
      const orgResult = await admin.from("organizations").insert([
        { id: orgA.id, slug: orgA.slug, name: orgA.name, owner_auth_user_id: ownerId },
        { id: orgB.id, slug: orgB.slug, name: orgB.name, owner_auth_user_id: ownerId },
      ]);
      if (orgResult.error) throw orgResult.error;

      const membershipResult = await admin.from("organization_memberships").insert({ organization_id: orgA.id, auth_user_id: ownerId, role: "owner", is_active: true });
      if (membershipResult.error) throw membershipResult.error;

      const memberResult = await admin.from("family_members").insert([
        { id: memberAId, owner_id: ownerId, organization_id: orgA.id, name: `${fixture.prefix} Member A`, role: "adult", monthly_limit: 100, currency: "EUR", is_active: true },
        { id: memberBId, owner_id: ownerId, organization_id: orgB.id, name: `${fixture.prefix} Member B`, role: "adult", monthly_limit: 100, currency: "EUR", is_active: true },
        { id: legacyMemberId, owner_id: ownerId, organization_id: null, name: `${fixture.prefix} Legacy Member`, role: "adult", monthly_limit: 100, currency: "EUR", is_active: true },
      ]);
      if (memberResult.error) throw memberResult.error;

      const result = await user.from("family_members").select("id").in("id", memberIds);
      if (result.error) throw result.error;

      expect(result.data?.map((row) => row.id).sort()).toEqual([memberAId, legacyMemberId].sort());
    } finally {
      await admin.from("family_members").delete().in("id", memberIds);
      await admin.from("organization_memberships").delete().in("organization_id", orgIds);
      await admin.from("organizations").delete().in("id", orgIds);
      await user.auth.signOut();
    }
  });
});
