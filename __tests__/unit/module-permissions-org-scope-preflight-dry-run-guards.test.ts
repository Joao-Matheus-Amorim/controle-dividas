import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sqlFiles = {
  preflight: "docs/sql/module-permissions-organization-null-preflight.sql",
  dryRun: "docs/sql/module-permissions-organization-dry-run.sql",
} as const;

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .toLowerCase();
}

function expectReadOnlySql(sql: string) {
  const executableSql = stripSqlComments(sql);
  const forbiddenTokens = [
    "insert",
    "update",
    "delete",
    "alter",
    "drop",
    "truncate",
    "create",
    "grant",
    "revoke",
    "merge",
    "call",
  ];

  for (const token of forbiddenTokens) {
    expect(executableSql).not.toMatch(new RegExp(`\\b${token}\\b`));
  }
}

describe("module permissions organization scope preflight and dry-run SQL", () => {
  const preflight = read(sqlFiles.preflight);
  const dryRun = read(sqlFiles.dryRun);
  const audit = read("docs/audits/USER_MODULE_PERMISSIONS_ORGANIZATION_SCOPE_READINESS.md");

  it("keeps the module permissions null preflight read-only and table-scoped", () => {
    expect(preflight).toContain("issue: #610");
    expect(preflight).toContain('from "public"."user_module_permissions"');
    expect(preflight).toContain('where "organization_id" is null');
    expect(preflight).toContain("null_organization_rows");
    expect(preflight).not.toContain('"public"."user_feature_permissions"');
    expect(preflight).not.toContain('"public"."banks"');
    expect(preflight).not.toContain('"public"."profiles"');
    expectReadOnlySql(preflight);
  });

  it("keeps the module permissions dry-run read-only and table-scoped", () => {
    expect(dryRun).toContain("issue: #610");
    expect(dryRun).toContain('from "public"."user_module_permissions"');
    expect(dryRun).toContain("deterministically_mappable");
    expect(dryRun).toContain("needs_review");
    expect(dryRun).toContain("total_legacy_null_organization_rows");
    expect(dryRun).not.toContain('"public"."user_feature_permissions"');
    expect(dryRun).not.toContain('"public"."banks"');
    expectReadOnlySql(dryRun);
  });

  it("keeps the readiness audit linked to the read-only checks", () => {
    expect(audit).toContain(sqlFiles.preflight);
    expect(audit).toContain(sqlFiles.dryRun);
    expect(audit).toContain("preparation only");
    expect(audit).toContain("do not mutate data");
    expect(audit).toContain("do not apply constraints");
  });
});
