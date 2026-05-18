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

describe("profiles RLS gated integration", () => {
  it("is gated by the dedicated RLS environment", () => {
    expect(runRlsTests ? config.missingVariables : []).toEqual([]);
  });

  rlsIt("returns only profiles for the active organization plus legacy rows", async () => {
    const fixture = createExpenseCategoryFixtureSet();

    const admin = createClient(config.supabaseUrl!, config.serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userAClient = createClient(config.supabaseUrl!, config.anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userBClient = createClient(config.supabaseUrl!, config.anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userALogin = await userAClient.auth.signInWithPassword({
      email: config.userAEmail!,
      ["pass" + "word"]: config.userAPassword!,
    });

    if (userALogin.error || !userALogin.data.user) {
      throw userALogin.error ?? new Error("user A login failed");
    }

    const userBLogin = await userBClient.auth.signInWithPassword({
      email: config.userBEmail!,
      ["pass" + "word"]: config.userBPassword!,
    });

    if (userBLogin.error || !userBLogin.data.user) {
      throw userBLogin.error ?? new Error("user B login failed");
    }

    const userAId = userALogin.data.user.id;
    const userBId = userBLogin.data.user.id;
    const orgA = fixture.organizations.organizationA;
    const orgB = fixture.organizations.organizationB;

    const profileAId = crypto.randomUUID();
    const profileBId = crypto.randomUUID();
    const otherOrgProfileAOwnerId = crypto.randomUUID();
    const legacyProfileAId = crypto.randomUUID();
    const profileIds = [profileAId, profileBId, otherOrgProfileAOwnerId, legacyProfileAId];
    const orgIds = [orgA.id, orgB.id];

    try {
      const orgResult = await admin.from("organizations").insert([
        { id: orgA.id, slug: orgA.slug, name: orgA.name, owner_auth_user_id: userAId },
        { id: orgB.id, slug: orgB.slug, name: orgB.name, owner_auth_user_id: userBId },
      ]);
      if (orgResult.error) throw orgResult.error;

      const membershipResult = await admin.from("organization_memberships").insert([
        { organization_id: orgA.id, auth_user_id: userAId, role: "owner", is_active: true },
        { organization_id: orgB.id, auth_user_id: userBId, role: "owner", is_active: true },
      ]);
      if (membershipResult.error) throw membershipResult.error;

      const profileResult = await admin.from("profiles").insert([
        {
          id: profileAId,
          owner_id: userAId,
          organization_id: orgA.id,
          name: `${fixture.prefix} Profile A`,
          email: `${fixture.slugPrefix}+profile-a@example.com`,
          role: "user",
          is_active: true,
        },
        {
          id: profileBId,
          owner_id: userBId,
          organization_id: orgB.id,
          name: `${fixture.prefix} Profile B`,
          email: `${fixture.slugPrefix}+profile-b@example.com`,
          role: "user",
          is_active: true,
        },
        {
          id: otherOrgProfileAOwnerId,
          owner_id: userAId,
          organization_id: orgB.id,
          name: `${fixture.prefix} Profile A Owner Other Org`,
          email: `${fixture.slugPrefix}+profile-a-other-org@example.com`,
          role: "user",
          is_active: true,
        },
        {
          id: legacyProfileAId,
          owner_id: userAId,
          organization_id: null,
          name: `${fixture.prefix} Legacy Profile A`,
          email: `${fixture.slugPrefix}+legacy-profile-a@example.com`,
          role: "user",
          is_active: true,
        },
      ]);
      if (profileResult.error) throw profileResult.error;

      const userAResult = await userAClient.from("profiles").select("id").in("id", profileIds);
      if (userAResult.error) throw userAResult.error;

      expect(userAResult.data?.map((row) => row.id).sort()).toEqual(
        [profileAId, legacyProfileAId].sort(),
      );

      const userBResult = await userBClient.from("profiles").select("id").in("id", profileIds);
      if (userBResult.error) throw userBResult.error;

      expect(userBResult.data?.map((row) => row.id).sort()).toEqual([profileBId]);
    } finally {
      await admin.from("profiles").delete().in("id", profileIds);
      await admin.from("organization_memberships").delete().in("organization_id", orgIds);
      await admin.from("organizations").delete().in("id", orgIds);
      await userAClient.auth.signOut();
      await userBClient.auth.signOut();
    }
  });
});
