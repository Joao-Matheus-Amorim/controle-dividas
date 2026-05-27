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

describe("banks organization scope readiness", () => {
  const actions = read("app/protected/bancos/actions.ts");
  const bankReads = read("lib/finance/banks-server.ts");
  const audit = read("docs/audits/BANKS_ORGANIZATION_SCOPE_READINESS.md");

  const createBankAccountBody = extractFunctionBody(
    actions,
    "export async function createbankaccount",
  );
  const updateBankAccountBody = extractFunctionBody(
    actions,
    "export async function updatebankaccount",
  );
  const updateBankAccountBalanceBody = extractFunctionBody(
    actions,
    "export async function updatebankaccountbalance",
  );
  const assertCanManageBankAccountBody = extractFunctionBody(
    actions,
    "async function assertcanmanagebankaccount",
  );
  const deleteBankAccountBody = extractFunctionBody(
    actions,
    "export async function deletebankaccount",
  );
  const getBankAccountsBody = extractFunctionBody(bankReads, "export async function getbankaccounts");

  it("keeps createBankAccount writing organization_id from the active organization", () => {
    expect(createBankAccountBody).toContain("requireorganizationaccess");
    expect(createBankAccountBody).toContain("organization_id: organization.id");
    expect(createBankAccountBody).toContain("assertmemberbelongstoorganization");
    expect(createBankAccountBody).toContain("assertcanaccessmember");
  });

  it("keeps updateBankAccount preserving organization scope", () => {
    expect(updateBankAccountBody).toContain("assertcanmanagebankaccount");
    expect(updateBankAccountBody).toContain("organization_id: organization.id");
    expect(updateBankAccountBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps updateBankAccountBalance preserving organization scope", () => {
    expect(updateBankAccountBalanceBody).toContain("assertcanmanagebankaccount");
    expect(updateBankAccountBalanceBody).toContain("organization_id: organization.id");
    expect(updateBankAccountBalanceBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps manage path scoped by owner and active organization", () => {
    expect(assertCanManageBankAccountBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(assertCanManageBankAccountBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(assertCanManageBankAccountBody).toContain("assertmemberbelongstoorganization");
    expect(assertCanManageBankAccountBody).toContain("assertcanaccessmember");
  });

  it("keeps delete path scoped by owner and active organization", () => {
    expect(deleteBankAccountBody).toContain("assertcanmanagebankaccount");
    expect(deleteBankAccountBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(deleteBankAccountBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("records that the read path remains transitional", () => {
    expect(getBankAccountsBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(getBankAccountsBody).toContain(".in(\"family_member_id\", accessiblememberids)");
    expect(audit).toContain("read path relies on accessible members instead of explicit `banks.organization_id` filtering");
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
