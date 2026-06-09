import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const auditPath = "docs/audits/USER_FEATURE_PERMISSIONS_WRITE_PATH_AUDIT.md";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

describe("user feature permissions write path audit", () => {
  const audit = normalize(read(auditPath));
  const actions = read("app/protected/admin/actions.ts");
  const page = read("features/protected-pages/admin-permissoes-page.tsx");
  const section = read("components/admin/permissions/admin-permissions-form-section.tsx");
  const form = read("components/finance/feature-permissions-form.tsx");

  it("documents the blocked hardening decision after adding the scoped write path", () => {
    expect(audit).toContain("readiness: blocked pending readiness, preflight, and dry-run");
    expect(audit).toContain("write path: scoped server action exists");
    expect(audit).toContain("do not add preflight/dry-run sql or a schema hardening migration");
  });

  it("documents audited read paths and transitional fallback", () => {
    expect(audit).toContain("lib/finance/admin-server.ts");
    expect(audit).toContain("getfamilyfeaturepermissions");
    expect(audit).toContain("lib/finance/access-control.ts");
    expect(audit).toContain("getfeaturepermission");
    expect(audit).toContain("organization_id is null");
  });

  it("does not claim schema hardening readiness", () => {
    expect(audit).not.toContain("readiness: ready");
    expect(audit).not.toContain("readiness: mostly ready");
    expect(audit).not.toContain("next safe step: future dedicated hardening pr");
  });

  it("keeps the feature permission write path scoped and callable", () => {
    expect(actions).toContain("saveProfileFeaturePermissions");
    expect(actions).toContain("ensureProfileBelongsToOrganization");
    expect(actions).toContain("organization_id: organization.id");
    expect(actions).toContain("const legacyOwnerId = organization.owner_auth_user_id");
    expect(actions).toContain("owner_id: legacyOwnerId");
    expect(actions).toContain("granted_by: adminProfile.id");
    expect(page).toContain("featurePermissions");
    expect(section).toContain("FeaturePermissionsForm");
    expect(form).toContain("useActionState(saveProfileFeaturePermissions");
  });
});
