import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("admin permissions ownership guards", () => {
  it("keeps admin dashboard data centralized in getAdminDashboardData", () => {
    const adminPage = readSource("app/protected/admin/page.tsx");
    const usersPage = readSource("app/protected/admin/usuarios/page.tsx");
    const permissionsPage = readSource("app/protected/admin/permissoes/page.tsx");

    for (const source of [adminPage, usersPage, permissionsPage]) {
      expect(source).toContain("@/lib/finance/admin-server");
      expect(source).toContain("getAdminDashboardData");
    }
  });

  it("keeps admin profile and permission reads scoped to the active organization without legacy rows", () => {
    const source = readSource("lib/finance/admin-server.ts");

    expect(source).toContain("function getConfiguredAdminEmail");
    expect(source).toContain("process.env.ADMIN_EMAIL");
    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("requireOrganizationAccess");
    expect(source).not.toContain("function organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
    expect(source).toContain("export async function getFamilyProfiles");
    expect(source).toContain("export async function getFamilyPermissions");
    expect(source).toContain("export async function getFamilyFeaturePermissions");
    expect(source).toContain("organization_id, auth_user_id");
    expect(source).toContain("owner_id, organization_id, profile_id");
    expect(source).toContain('.eq("owner_id", adminProfile.owner_id)');
    expect(source).toContain('.eq("organization_id", organizationId)');
    expect(source).not.toContain(".or(organizationOrLegacyFilter(organizationId))");
  });

  it("keeps admin user and permission writes tied to the active organization", () => {
    const source = readSource("app/protected/admin/actions.ts");

    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("requireOrganizationAccess");
    expect(source).toContain("function organizationOrLegacyFilter");
    expect(source).toContain("async function ensureMemberBelongsToOrganization");
    expect(source).toContain("async function ensureProfileBelongsToOrganization");
    expect(source).toContain("organization_id.eq.${organizationId}");
    expect(source).toContain("organization_id.is.null");
    expect(source).toContain("organization_id: organization.id");
    expect(source).toContain(".or(organizationOrLegacyFilter(organization.id))");
  });

  it("keeps feature permission writes scoped to the active organization", () => {
    const source = readSource("app/protected/admin/actions.ts");

    expect(source).toContain("export async function saveProfileFeaturePermissions");
    expect(source).toContain("FEATURE_PERMISSIONS.map");
    expect(source).toContain("await ensureProfileBelongsToOrganization(adminProfile.owner_id, organization.id, profileId)");
    expect(source).toContain("owner_id: adminProfile.owner_id");
    expect(source).toContain("organization_id: organization.id");
    expect(source).toContain("profile_id: profileId");
    expect(source).toContain("feature_key: feature.key");
    expect(source).toContain("is_enabled: isFeatureEnabled(formData, feature.key)");
    expect(source).toContain("granted_by: adminProfile.id");
    expect(source).toContain('.from("user_feature_permissions")');
    expect(source).toContain('.upsert(rows, { onConflict: "profile_id,feature_key" })');
  });

  it("documents runtime access control as active-organization scoped without legacy permission fallback", () => {
    const source = readSource("lib/finance/access-control.ts");

    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("requireOrganizationAccess");
    expect(source).toContain("organization_id: string | null");
    expect(source).toContain("async function getActiveOrganizationId");
    expect(source).toContain('.eq("organization_id", organizationId)');
    expect(source).not.toContain("function organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
    expect(source).not.toContain("pickOrganizationScopedRow");
  });

  it("keeps bootstrap admin profile helper isolated from runtime callers", () => {
    const helper = readSource("lib/finance/bootstrap-admin-profile.ts");
    const accessControl = readSource("lib/finance/access-control.ts");
    const adminServer = readSource("lib/finance/admin-server.ts");

    expect(helper).toContain("export function getBootstrapProfileName(email: string | null)");
    expect(helper).toContain("export function createBootstrapAdminProfile");

    for (const source of [accessControl, adminServer]) {
      expect(source).not.toContain("@/lib/finance/bootstrap-admin-profile");
      expect(source).not.toContain("createBootstrapAdminProfile({");
      expect(source).not.toContain('.from("profiles").upsert');
      expect(source).not.toContain('.from("profiles").insert');
      expect(source).toContain('redirect("/onboarding/organizacao")');
    }
  });
});