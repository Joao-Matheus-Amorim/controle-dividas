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

  it("keeps admin profile and permission reads scoped to the active organization plus legacy rows", () => {
    const source = readSource("lib/finance/admin-server.ts");

    expect(source).toContain("function getConfiguredAdminEmail");
    expect(source).toContain("process.env.ADMIN_EMAIL");
    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("requireOrganizationAccess");
    expect(source).toContain("function organizationOrLegacyFilter");
    expect(source).toContain("organization_id.eq.${organizationId}");
    expect(source).toContain("organization_id.is.null");
    expect(source).toContain("export async function getFamilyProfiles");
    expect(source).toContain("export async function getFamilyPermissions");
    expect(source).toContain("export async function getFamilyFeaturePermissions");
    expect(source).toContain("organization_id, auth_user_id");
    expect(source).toContain("owner_id, organization_id, profile_id");
    expect(source).toContain('.eq("owner_id", adminProfile.owner_id)');
    expect(source).toContain(".or(organizationOrLegacyFilter(organizationId))");
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
    expect(source).toContain("ensureUniqueEmail({ ownerId: adminProfile.owner_id, organizationId: organization.id, email })");
    expect(source).toContain("ensureMemberBelongsToOrganization(adminProfile.owner_id, organization.id, linkedFamilyMemberId)");
    expect(source).toContain("ensureProfileBelongsToOrganization(adminProfile.owner_id, organization.id, profileId)");
    expect(source).toContain(".or(organizationOrLegacyFilter(organization.id))");
  });

  it("documents current access control as active-organization scoped", () => {
    const source = readSource("lib/finance/access-control.ts");

    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("requireOrganizationAccess");
    expect(source).toContain("organization_id: string | null");
    expect(source).toContain("function organizationOrLegacyFilter");
    expect(source).toContain("organization_id.eq.${organizationId}");
    expect(source).toContain("organization_id.is.null");
    expect(source).toContain("async function getActiveOrganizationId");
    expect(source).toContain("async function getAllActiveMemberIds(ownerId: string, organizationId: string)");
    expect(source).toContain('.eq("owner_id", ownerId)');
    expect(source).toContain('.or(organizationOrLegacyFilter(organizationId))');
    expect(source).toContain("pickOrganizationScopedRow");
    expect(source).toContain("profile.role === \"admin\"");
    expect(source).toContain("return getAllActiveMemberIds(profile.owner_id, organizationId)");
  });

  it("keeps runtime bootstrap admin names derived from email or neutral fallback", () => {
    const accessControl = readSource("lib/finance/access-control.ts");
    const adminServer = readSource("lib/finance/admin-server.ts");

    for (const source of [accessControl, adminServer]) {
      expect(source).toContain("function getBootstrapProfileName(email: string | null)");
      expect(source).toContain('return localPart || "Admin"');
      expect(source).toContain("name: getBootstrapProfileName(user.email)");
      expect(source).not.toContain('name: "Danyel"');
    }
  });
});