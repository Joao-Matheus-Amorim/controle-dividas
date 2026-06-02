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

describe("admin multi-org RLS gated integration", () => {
  it("is gated by the dedicated RLS environment", () => {
    expect(runRlsTests ? config.missingVariables : []).toEqual([]);
  });

  rlsIt(
    "lets an admin membership read organization-scoped admin data without shared owner_id",
    async () => {
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
        password: config.userAPassword!,
      });

      if (userALogin.error || !userALogin.data.user) {
        throw userALogin.error ?? new Error("user A login failed");
      }

      const userBLogin = await userBClient.auth.signInWithPassword({
        email: config.userBEmail!,
        password: config.userBPassword!,
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
      const outsiderProfileId = crypto.randomUUID();
      const profileIds = [profileAId, profileBId, outsiderProfileId];

      const modulePermissionAId = crypto.randomUUID();
      const modulePermissionBId = crypto.randomUUID();
      const outsiderModulePermissionId = crypto.randomUUID();
      const modulePermissionIds = [
        modulePermissionAId,
        modulePermissionBId,
        outsiderModulePermissionId,
      ];

      const featurePermissionAId = crypto.randomUUID();
      const featurePermissionBId = crypto.randomUUID();
      const outsiderFeaturePermissionId = crypto.randomUUID();
      const featurePermissionIds = [
        featurePermissionAId,
        featurePermissionBId,
        outsiderFeaturePermissionId,
      ];

      const orgIds = [orgA.id, orgB.id];

      try {
        const orgResult = await admin.from("organizations").insert([
          {
            id: orgA.id,
            slug: orgA.slug,
            name: orgA.name,
            owner_auth_user_id: userAId,
          },
          {
            id: orgB.id,
            slug: orgB.slug,
            name: orgB.name,
            owner_auth_user_id: userBId,
          },
        ]);

        if (orgResult.error) throw orgResult.error;

        const membershipResult = await admin.from("organization_memberships").insert([
          {
            organization_id: orgA.id,
            auth_user_id: userAId,
            role: "owner",
            is_active: true,
          },
          {
            organization_id: orgB.id,
            auth_user_id: userBId,
            role: "owner",
            is_active: true,
          },
          {
            organization_id: orgB.id,
            auth_user_id: userAId,
            role: "admin",
            is_active: true,
          },
        ]);

        if (membershipResult.error) throw membershipResult.error;

        const profileResult = await admin.from("profiles").insert([
          {
            id: profileAId,
            owner_id: userAId,
            organization_id: orgA.id,
            name: `${fixture.prefix} Admin Profile Org A`,
            email: `${fixture.slugPrefix}+admin-profile-a@example.com`,
            role: "admin",
            is_active: true,
          },
          {
            id: profileBId,
            owner_id: userBId,
            organization_id: orgB.id,
            name: `${fixture.prefix} Admin Profile Org B`,
            email: `${fixture.slugPrefix}+admin-profile-b@example.com`,
            role: "admin",
            is_active: true,
          },
          {
            id: outsiderProfileId,
            owner_id: userBId,
            organization_id: orgB.id,
            name: `${fixture.prefix} Outsider Profile Org B`,
            email: `${fixture.slugPrefix}+outsider-profile-b@example.com`,
            role: "user",
            is_active: true,
          },
        ]);

        if (profileResult.error) throw profileResult.error;

        const modulePermissionResult = await admin
          .from("user_module_permissions")
          .insert([
            {
              id: modulePermissionAId,
              owner_id: userAId,
              organization_id: orgA.id,
              profile_id: profileAId,
              module: "ADMIN",
              can_view: true,
              can_create: true,
              can_edit: true,
              can_delete: false,
              scope: "family",
              allowed_member_ids: [],
            },
            {
              id: modulePermissionBId,
              owner_id: userBId,
              organization_id: orgB.id,
              profile_id: profileBId,
              module: "CONFIGURACOES",
              can_view: true,
              can_create: false,
              can_edit: true,
              can_delete: false,
              scope: "family",
              allowed_member_ids: [],
            },
            {
              id: outsiderModulePermissionId,
              owner_id: userBId,
              organization_id: orgB.id,
              profile_id: outsiderProfileId,
              module: "BANCOS",
              can_view: true,
              can_create: false,
              can_edit: false,
              can_delete: false,
              scope: "own",
              allowed_member_ids: [],
            },
          ]);

        if (modulePermissionResult.error) throw modulePermissionResult.error;

        const featurePermissionResult = await admin
          .from("user_feature_permissions")
          .insert([
            {
              id: featurePermissionAId,
              owner_id: userAId,
              organization_id: orgA.id,
              profile_id: profileAId,
              feature_key: "manage_users",
              is_enabled: true,
            },
            {
              id: featurePermissionBId,
              owner_id: userBId,
              organization_id: orgB.id,
              profile_id: profileBId,
              feature_key: "manage_permissions",
              is_enabled: true,
            },
            {
              id: outsiderFeaturePermissionId,
              owner_id: userBId,
              organization_id: orgB.id,
              profile_id: outsiderProfileId,
              feature_key: "view_reports",
              is_enabled: true,
            },
          ]);

        if (featurePermissionResult.error) throw featurePermissionResult.error;

        const profileResultForAdmin = await userAClient
          .from("profiles")
          .select("id")
          .in("id", profileIds);

        if (profileResultForAdmin.error) throw profileResultForAdmin.error;

        expect(profileResultForAdmin.data?.map((row) => row.id).sort()).toEqual(
          profileIds.sort(),
        );

        const modulePermissionsForAdmin = await userAClient
          .from("user_module_permissions")
          .select("id")
          .in("id", modulePermissionIds);

        if (modulePermissionsForAdmin.error) throw modulePermissionsForAdmin.error;

        expect(modulePermissionsForAdmin.data?.map((row) => row.id).sort()).toEqual(
          modulePermissionIds.sort(),
        );

        const featurePermissionsForAdmin = await userAClient
          .from("user_feature_permissions")
          .select("id")
          .in("id", featurePermissionIds);

        if (featurePermissionsForAdmin.error) throw featurePermissionsForAdmin.error;

        expect(featurePermissionsForAdmin.data?.map((row) => row.id).sort()).toEqual(
          featurePermissionIds.sort(),
        );
      } finally {
        await admin
          .from("user_feature_permissions")
          .delete()
          .in("id", featurePermissionIds);

        await admin
          .from("user_module_permissions")
          .delete()
          .in("id", modulePermissionIds);

        await admin.from("profiles").delete().in("id", profileIds);

        await admin
          .from("organization_memberships")
          .delete()
          .in("organization_id", orgIds);

        await admin.from("organizations").delete().in("id", orgIds);

        await userAClient.auth.signOut();
        await userBClient.auth.signOut();
      }
    },
    30000,
  );
});
