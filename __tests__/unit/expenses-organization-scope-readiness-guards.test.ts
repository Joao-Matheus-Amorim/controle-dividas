import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("expenses organization scope readiness", () => {
  const actions = read("app/protected/gastos/actions.ts");
  const expenseReads = read("lib/finance/expenses-server.ts");
  const audit = read("docs/audits/EXPENSES_ORGANIZATION_SCOPE_READINESS.md");

  it("keeps createExpense writing organization_id from the active organization", () => {
    expect(actions).toContain("export async function createexpense");
    expect(actions).toContain("requireorganizationaccess");
    expect(actions).toContain("organization_id: organization.id");
  });

  it("keeps updateExpense preserving organization scope", () => {
    expect(actions).toContain("export async function updateexpense");
    expect(actions).toContain("organization_id: organization.id");
    expect(actions).toContain("organizationorlegacyfilter(organization.id)");
  });

  it("keeps manage/delete paths scoped by owner and transitional organization filter", () => {
    expect(actions).toContain("async function assertcanmanageexpense");
    expect(actions).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(actions).toContain("organizationorlegacyfilter(organization.id)");
    expect(actions).toContain("export async function deleteexpense");
  });

  it("records that the read path remains transitional", () => {
    expect(expenseReads).toContain("getexpensesfromclient");
    expect(expenseReads).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(expenseReads).toContain(".in(\"family_member_id\", accessiblememberids)");
    expect(audit).toContain("read path relies on accessible members instead of explicit `expenses.organization_id` filtering");
  });

  it("keeps the audit as readiness-only, not a hardening migration", () => {
    expect(audit).toContain("this document does not introduce a migration");
    expect(audit).toContain("not be hardened in this pr");
    expect(audit).toContain("fresh null-organization preflight evidence");
    expect(audit).toContain("fresh deterministic dry-run evidence");
    expect(audit).toContain("migration-local preflight guard");
    expect(audit).toContain("no runtime, rls, ui, billing or e2e mixing");
  });
});
