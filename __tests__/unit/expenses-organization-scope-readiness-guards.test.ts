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
  const expenseReads = read("lib/organizations/expenses.ts");
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
  const getOrganizationExpensesBody = extractFunctionBody(
    expenseReads,
    "export async function getorganizationexpenses",
  );

  it("keeps createExpense writing organization_id from the active organization", () => {
    expect(createExpenseBody).toContain("requireorganizationaccess");
    expect(createExpenseBody).toContain("organization_id: organization.id");
  });

  it("keeps updateExpense preserving organization scope", () => {
    expect(updateExpenseBody).toContain("organization_id: organization.id");
    expect(updateExpenseBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps manage path scoped by active organization and member permission", () => {
    expect(assertCanManageExpenseBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(assertCanManageExpenseBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(assertCanManageExpenseBody).toContain("assertmemberbelongstoorganization");
    expect(assertCanManageExpenseBody).toContain("assertcanaccessmember");
  });

  it("keeps delete path scoped by active organization filter", () => {
    expect(deleteExpenseBody).toContain("assertcanmanageexpense");
    expect(deleteExpenseBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(deleteExpenseBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("records that the organization read path is scoped by active organization and accessible members", () => {
    expect(getOrganizationExpensesBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(getOrganizationExpensesBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(getOrganizationExpensesBody).toContain(".in(\"family_member_id\", scopedmemberids)");
    expect(audit).toContain("organization read path filters `expenses.organization_id` and accessible member ids");
  });

  it("keeps the audit scoped to the expense write boundary, not schema final", () => {
    expect(audit).toContain("dedicated write-boundary migration for `expenses`");
    expect(audit).toContain("does not introduce schema-final removal of legacy `owner_id`");
    expect(audit).toContain("organization write/read boundary versioned");
    expect(audit).toContain("focused rls guard evidence");
    expect(audit).toContain("no runtime, rls, ui, billing or e2e mixing");
  });
});
