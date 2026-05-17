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

  it("documents current admin profile and permissions queries as owner-centric", () => {
    const source = readSource("lib/finance/admin-server.ts");

    expect(source).toContain("function getConfiguredAdminEmail");
    expect(source).toContain("process.env.ADMIN_EMAIL");
    expect(source).toContain("export async function getFamilyProfiles");
    expect(source).toContain("export async function getFamilyPermissions");
    expect(source).toContain("export async function getFamilyFeaturePermissions");
    expect(source).toContain('.eq("owner_id", adminProfile.owner_id)');
  });

  it("documents current access control as profile and owner based", () => {
    const source = readSource("lib/finance/access-control.ts");

    expect(source).toContain("export async function getCurrentProfile");
    expect(source).toContain("async function getAllActiveMemberIds(ownerId: string)");
    expect(source).toContain('.eq("owner_id", ownerId)');
    expect(source).toContain("profile.role === \"admin\"");
    expect(source).toContain("return getAllActiveMemberIds(profile.owner_id)");
  });
});
