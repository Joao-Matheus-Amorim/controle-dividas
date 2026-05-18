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

describe("user_module_permissions RLS gated integration", () => {
  it("is gated by the dedicated RLS environment", () => {
    expect(runRlsTests ? config.missingVariables : []).toEqual([]);
  });

  rlsIt(
    "returns only module permissions for the active organization plus legacy rows",
    async () => {
      const fixture = createExpenseCategoryFixtureSet();

      const admin = createClient(config.supabaseUrl!, config.serviceRoleKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const userClient = createClient(config.supabaseUrl!, config.anonKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const login = await userClient.auth.signInWithPassword({
        email: config.userAEmail!,
        password: config.userAPassword!,
      });

      if (login.error || !login.data.user) {
        throw login.error ?? new Error("login failed");
      }

      const ownerId = login.data.user.id;
      const orgA = fixture.organizations.organizationA;
      const orgB = fixture.organizations.organizationB;

      const profileAId = crypto.randomUUID();
      const profileBId = crypto.randomUUID();
      const legacyProfileId = crypto.randomUUID();

      const permissionAId = crypto.randomUUID();
      const permissionBId = crypto.randomUUID();
      const legacyPermissionId = crypto.randomUUID();

      const profileIds = [profileAId, profileBId, legacyProfileId];
      const permissionIds = [permissionAId, permissionBId, legacyPermissionId];
      const orgIds = [orgA.id, orgB.id];

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

        const profileResult = await admin.from("profiles").insert([
          {
            id: profileAId,
            owner_id: ownerId,
            organization_id: orgA.id,
            name: `${fixture.prefix} Permission Profile A`,
            email: `${fixture.slugPrefix}+permission-profile-a@example.com`,
            role: "user",
            is_active: true,
          },
          {
            id: profileBId,
            owner_id: ownerId,
            organization_id: orgB.id,
            name: `${fixture.prefix} Permission Profile B`,
            email: `${fixture.slugPrefix}+permission-profile-b@example.com`,
            role: "user",
            is_active: true,
          },
          {
            id: legacyProfileId,
            owner_id: ownerId,
            organization_id: null,
            name: `${fixture.prefix} Legacy Permission Profile`,
            email: `${fixture.slugPrefix}+legacy-permission-profile@example.com`,
            role: "user",
            is_active: true,
          },
        ]);

        if (profileResult.error) throw profileResult.error;

        const permissionResult = await admin
          .from("user_module_permissions")
          .insert([
            {
              id: permissionAId,
              owner_id: ownerId,
              organization_id: orgA.id,
              profile_id: profileAId,
              module: "GASTOS",
              can_view: true,
              can_create: true,
              can_edit: false,
              can_delete: false,
              scope: "own",
              allowed_member_ids: [],
            },
            {
              id: permissionBId,
              owner_id: ownerId,
              organization_id: orgB.id,
              profile_id: profileBId,
              module: "BANCOS",
              can_view: true,
              can_create: false,
              can_edit: false,
              can_delete: false,
              scope: "own",
              allowed_member_ids: [],
            },
            {
              id: legacyPermissionId,
              owner_id: ownerId,
              organization_id: null,
              profile_id: legacyProfileId,
              module: "RELATORIOS",
              can_view: true,
              can_create: false,
              can_edit: false,
              can_delete: false,
              scope: "own",
              allowed_member_ids: [],
            },
          ]);

        if (permissionResult.error) throw permissionResult.error;

        const result = await userClient
          .from("user_module_permissions")
          .select("id")
          .in("id", permissionIds);

        if (result.error) throw result.error;

        expect(result.data?.map((row) => row.id).sort()).toEqual(
          [permissionAId, legacyPermissionId].sort(),
        );
      } finally {
        await admin
          .from("user_module_permissions")
          .delete()
          .in("id", permissionIds);

        await admin.from("profiles").delete().in("id", profileIds);

        await admin
          .from("organization_memberships")
          .delete()
          .in("organization_id", orgIds);

        await admin.from("organizations").delete().in("id", orgIds);

        await userClient.auth.signOut();
      }
    },
    30000,
  );
});