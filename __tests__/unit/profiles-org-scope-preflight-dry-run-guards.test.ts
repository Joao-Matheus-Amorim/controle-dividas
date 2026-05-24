import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sqlFiles = {
  preflight: "docs/sql/profile-organization-null-check.sql",
  dryRun: "docs/sql/profile-organization-dry-run.sql",
} as const;

const forbiddenTables = [
  "expenses",
  "payable_bills",
  "receivable_incomes",
  "banks",
  "user_module_permissions",
  "user_feature_permissions",
] as const;

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

function expectNoForbiddenTables(sql: string) {
  for (const table of forbiddenTables) {
    expect(sql).not.toContain(`from ${table}`);
    expect(sql).not.toContain(`join ${table}`);
    expect(sql).not.toContain(`from public.${table}`);
    expect(sql).not.toContain(`join public.${table}`);
    expect(sql).not.toContain(`"public"."${table}"`);
  }
}

describe("profiles organization scope preflight and dry-run SQL", () => {
  const preflight = read(sqlFiles.preflight);
  const dryRun = read(sqlFiles.dryRun);
  const audit = read("docs/audits/PROFILES_READINESS.md");

  it("keeps the profiles null preflight read-only and table-scoped", () => {
    expect(preflight).toContain("issue: #618");
    expect(preflight).toContain("from profiles");
    expect(preflight).toContain("where organization_id is null");
    expect(preflight).toContain("null_organization_rows");
    expectNoForbiddenTables(preflight);
    expectReadOnlySql(preflight);
  });

  it("keeps the profiles dry-run read-only and scoped to profiles plus organization memberships", () => {
    expect(dryRun).toContain("issue: #618");
    expect(dryRun).toContain("from profiles");
    expect(dryRun).toContain("join organization_memberships");
    expect(dryRun).toContain("already_scoped");
    expect(dryRun).toContain("deterministically_mappable");
    expect(dryRun).toContain("needs_review");
    expect(dryRun).toContain("total_legacy_null_organization_rows");
    expectNoForbiddenTables(dryRun);
    expectReadOnlySql(dryRun);
  });

  it("keeps the profiles readiness audit linked to the read-only checks", () => {
    expect(audit).toContain(sqlFiles.preflight);
    expect(audit).toContain(sqlFiles.dryRun);
    expect(audit).toContain("read-only evidence");
    expect(audit).toContain("no schema change");
    expect(audit).toContain("no data change");
  });
});
