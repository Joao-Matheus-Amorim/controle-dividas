import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const preflightPath = "docs/sql/finance-relationships-orphan-preflight.sql";

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
    "validate",
  ];

  for (const token of forbiddenTokens) {
    expect(executableSql).not.toMatch(new RegExp(`\\b${token}\\b`));
  }
}

describe("finance relationship orphan preflight", () => {
  const preflight = read(preflightPath);
  const checklist = read("docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md");

  it("keeps the restored FK orphan preflight read-only", () => {
    expect(preflight).toContain("read-only");
    expect(preflight).toContain("orphan_rows");
    expect(preflight).toContain("cleanup_required");
    expect(preflight).toContain("ready_for_validation");
    expectReadOnlySql(preflight);
  });

  it("checks every finance relationship restored by migration 043", () => {
    expect(preflight).toContain("expenses.family_member_id -> family_members.id");
    expect(preflight).toContain("expenses.category_id -> expense_categories.id");
    expect(preflight).toContain("payable_bills.responsible_member_id -> family_members.id");
    expect(preflight).toContain("receivable_incomes.receiver_member_id -> family_members.id");
    expect(preflight).toContain("banks.family_member_id -> family_members.id");
  });

  it("keeps the operational checklist linked to the executable preflight", () => {
    expect(checklist).toContain(preflightPath);
    expect(checklist).toContain("preflight de orfaos");
    expect(checklist).toContain("not valid");
    expect(checklist).toContain("validate constraint");
  });
});
