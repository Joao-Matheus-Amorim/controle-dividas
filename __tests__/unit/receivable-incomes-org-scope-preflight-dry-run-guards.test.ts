import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sqlFiles = {
  preflight: "docs/sql/receivable-incomes-organization-null-preflight.sql",
  dryRun: "docs/sql/receivable-incomes-organization-dry-run.sql",
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

describe("receivable incomes organization scope preflight and dry-run SQL", () => {
  const preflight = read(sqlFiles.preflight);
  const dryRun = read(sqlFiles.dryRun);
  const audit = read("docs/audits/RECEIVABLE_INCOMES_ORGANIZATION_SCOPE_READINESS.md");

  it("keeps the receivable incomes null preflight read-only and table-scoped", () => {
    expect(preflight).toContain("issue: #598");
    expect(preflight).toContain("read-only");
    expect(preflight).toContain("from public.receivable_incomes");
    expect(preflight).toContain("where organization_id is null");
    expect(preflight).toContain("null_organization_rows");
    expect(preflight).not.toContain("public.expenses");
    expect(preflight).not.toContain("public.payable_bills");
    expect(preflight).not.toContain("public.banks");
    expectReadOnlySql(preflight);
  });

  it("keeps the receivable incomes dry-run read-only and table-scoped", () => {
    expect(dryRun).toContain("issue: #598");
    expect(dryRun).toContain("read-only");
    expect(dryRun).toContain("from public.receivable_incomes");
    expect(dryRun).toContain("where organization_id is null");
    expect(dryRun).toContain("deterministically_mappable");
    expect(dryRun).toContain("blocked_missing_owner_profile");
    expect(dryRun).toContain("blocked_owner_without_organization");
    expect(dryRun).toContain("blocked_ambiguous_owner_organization");
    expect(dryRun).not.toContain("public.expenses");
    expect(dryRun).not.toContain("public.payable_bills");
    expect(dryRun).not.toContain("public.banks");
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
