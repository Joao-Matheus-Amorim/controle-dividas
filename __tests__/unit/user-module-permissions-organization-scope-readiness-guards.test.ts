import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractFunctionBody(source: string, signature: string) {
  const signatureIndex = source.indexOf(signature);

  if (signatureIndex === -1) {
    throw new Error(`Function signature not found: ${signature}`);
  }

  const bodyStart = source.indexOf("{", signatureIndex);

  if (bodyStart === -1) {
    throw new Error(`Function body not found: ${signature}`);
  }

  let depth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;
    }

    if (depth === 0) {
      return source.slice(bodyStart, index + 1);
    }
  }

  throw new Error(`Function body was not closed: ${signature}`);
}

describe("user module permissions organization scope readiness", () => {
  const actions = read("app/protected/admin/actions.ts");
  const adminServer = read("lib/finance/admin-server.ts");
  const audit = read("docs/audits/USER_MODULE_PERMISSIONS_ORGANIZATION_SCOPE_READINESS.md");

  const createFamilyUserBody = extractFunctionBody(
    actions,
    "export async function createfamilyuser",
  );
  const saveProfilePermissionsBody = extractFunctionBody(
    actions,
    "export async function saveprofilepermissions",
  );
  const getFamilyPermissionsBody = extractFunctionBody(
    adminServer,
    "export async function getfamilypermissions",
  );

  it("keeps createFamilyUser writing organization_id on module permission rows", () => {
    expect(createFamilyUserBody).toContain("requireorganizationaccess");
    expect(createFamilyUserBody).toContain("ensurememberbelongstoorganization");
    expect(createFamilyUserBody).toContain("organization_id: organization.id");
    expect(createFamilyUserBody).toContain('from("user_module_permissions")');
    expect(createFamilyUserBody).toContain(".insert(permissionrows)");
  });

  it("keeps saveProfilePermissions upserting organization-scoped rows", () => {
    expect(saveProfilePermissionsBody).toContain("requireorganizationaccess");
    expect(saveProfilePermissionsBody).toContain("ensureprofilebelongstoorganization");
    expect(saveProfilePermissionsBody).toContain("organization_id: organization.id");
    expect(saveProfilePermissionsBody).toContain('from("user_module_permissions")');
    expect(saveProfilePermissionsBody).toContain(".upsert(rows");
  });

  it("keeps module permission reads scoped by owner and transitional organization filter", () => {
    expect(getFamilyPermissionsBody).toContain('from("user_module_permissions")');
    expect(getFamilyPermissionsBody).toContain(".eq(\"owner_id\", adminprofile.owner_id)");
    expect(getFamilyPermissionsBody).toContain("organizationorlegacyfilter(organizationid)");
  });

  it("keeps the audit as readiness-only, not a hardening migration", () => {
    expect(audit).toContain("this document does not introduce a migration");
    expect(audit).toContain("should not be hardened in this pr");
    expect(audit).toContain("fresh null-organization preflight evidence");
    expect(audit).toContain("fresh deterministic dry-run evidence");
    expect(audit).toContain("migration-local preflight guard");
    expect(audit).toContain("no runtime, rls, ui, billing or e2e mixing");
  });
});
