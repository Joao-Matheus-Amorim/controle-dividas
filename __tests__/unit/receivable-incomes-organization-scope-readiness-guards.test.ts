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

describe("receivable incomes organization scope readiness", () => {
  const actions = read("app/protected/contas-a-receber/actions.ts");
  const receivableReads = read("lib/organizations/receivables.ts");
  const audit = read("docs/audits/RECEIVABLE_INCOMES_ORGANIZATION_SCOPE_READINESS.md");

  const createReceivableIncomeBody = extractFunctionBody(
    actions,
    "export async function createreceivableincome",
  );
  const updateReceivableIncomeBody = extractFunctionBody(
    actions,
    "export async function updatereceivableincome",
  );
  const updateReceivableIncomeStatusBody = extractFunctionBody(
    actions,
    "export async function updatereceivableincomestatus",
  );
  const assertCanManageReceivableIncomeBody = extractFunctionBody(
    actions,
    "async function assertcanmanagereceivableincome",
  );
  const deleteReceivableIncomeBody = extractFunctionBody(
    actions,
    "export async function deletereceivableincome",
  );
  const getOrganizationReceivableIncomesBody = extractFunctionBody(
    receivableReads,
    "export async function getorganizationreceivableincomes",
  );

  it("keeps createReceivableIncome writing organization_id from the active organization", () => {
    expect(createReceivableIncomeBody).toContain("requireorganizationaccess");
    expect(createReceivableIncomeBody).toContain("organization_id: organization.id");
    expect(createReceivableIncomeBody).toContain("owner_id: organization.owner_auth_user_id");
    expect(createReceivableIncomeBody).not.toContain("owner_id: profile.owner_id");
    expect(createReceivableIncomeBody).toContain("assertreceivermemberbelongstoorganization");
    expect(createReceivableIncomeBody).toContain("assertcanaccessmember");
  });

  it("keeps updateReceivableIncome preserving organization scope", () => {
    expect(updateReceivableIncomeBody).toContain("assertcanmanagereceivableincome");
    expect(updateReceivableIncomeBody).toContain("organization_id: organization.id");
    expect(updateReceivableIncomeBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps updateReceivableIncomeStatus preserving organization scope", () => {
    expect(updateReceivableIncomeStatusBody).toContain("assertcanmanagereceivableincome");
    expect(updateReceivableIncomeStatusBody).toContain("organization_id: organization.id");
    expect(updateReceivableIncomeStatusBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps manage path scoped by active organization", () => {
    expect(assertCanManageReceivableIncomeBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(assertCanManageReceivableIncomeBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(assertCanManageReceivableIncomeBody).toContain("assertreceivermemberbelongstoorganization");
    expect(assertCanManageReceivableIncomeBody).toContain("assertcanaccessmember");
  });

  it("keeps delete path scoped by active organization", () => {
    expect(deleteReceivableIncomeBody).toContain("assertcanmanagereceivableincome");
    expect(deleteReceivableIncomeBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(deleteReceivableIncomeBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("records that the read path is organization scoped", () => {
    expect(getOrganizationReceivableIncomesBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(getOrganizationReceivableIncomesBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(getOrganizationReceivableIncomesBody).toContain(".in(\"receiver_member_id\", accessiblememberids)");
    expect(audit).toContain("read path filters `receivable_incomes.organization_id` and accessible members");
  });

  it("records the receivable write boundary migration contract", () => {
    expect(audit).toContain("supabase/migrations/054_receivable_incomes_organization_write_rls.sql");
    expect(audit).toContain("owner_id remains a legacy schema column");
    expect(audit).toContain("organization.owner_auth_user_id");
    expect(audit).toContain("contas_a_receber");
    expect(audit).toContain("schema-final owner_id removal remains out of scope");
  });
});
