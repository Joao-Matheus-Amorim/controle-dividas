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

describe("expenses organization scope readiness", () => {
  const actions = read("app/protected/gastos/actions.ts");
  const expenseReads = read("lib/finance/expenses-server.ts");
  const audit = read("docs/audits/EXPENSES_ORGANIZATION_SCOPE_READINESS.md");

  const createExpenseBody = extractFunctionBody(
    actions,
    "export async function createexpense",
  );
  const updateExpenseBody = extractFunctionBody(
    actions,
    "export async function updateexpense",
  );
  const assertCanManageExpenseBody = extractFunctionBody(
    actions,
    "async function assertcanmanageexpense",
  );
  const deleteExpenseBody = extractFunctionBody(
    actions,
    "export async function deleteexpense",
  );
  const getExpensesFromClientBody = extractFunctionBody(
    expenseReads,
    "export async function getexpensesfromclient",
  );

  it("keeps createExpense writing organization_id from the active organization", () => {
    expect(createExpenseBody).toContain("requireorganizationaccess");
    expect(createExpenseBody).toContain("organization_id: organization.id");
  });

  it("keeps updateExpense preserving organization scope", () => {
    expect(updateExpenseBody).toContain("organization_id: organization.id");
    expect(updateExpenseBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps manage path scoped by owner and active organization filter", () => {
    expect(assertCanManageExpenseBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(assertCanManageExpenseBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(assertCanManageExpenseBody).toContain("assertmemberbelongstoorganization");
    expect(assertCanManageExpenseBody).toContain("assertcanaccessmember");
  });

  it("keeps delete path scoped by owner and active organization filter", () => {
    expect(deleteExpenseBody).toContain("assertcanmanageexpense");
    expect(deleteExpenseBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(deleteExpenseBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("records that the read path remains transitional", () => {
    expect(getExpensesFromClientBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(getExpensesFromClientBody).toContain(".in(\"family_member_id\", accessiblememberids)");
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
