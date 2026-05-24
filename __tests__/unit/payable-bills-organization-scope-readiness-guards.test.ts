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

describe("payable bills organization scope readiness", () => {
  const actions = read("app/protected/contas-a-pagar/actions.ts");
  const payableReads = read("lib/finance/payables-server.ts");
  const audit = read("docs/audits/PAYABLE_BILLS_ORGANIZATION_SCOPE_READINESS.md");

  const createPayableBillBody = extractFunctionBody(
    actions,
    "export async function createpayablebill",
  );
  const updatePayableBillBody = extractFunctionBody(
    actions,
    "export async function updatepayablebill",
  );
  const updatePayableBillStatusBody = extractFunctionBody(
    actions,
    "export async function updatepayablebillstatus",
  );
  const assertCanManagePayableBillBody = extractFunctionBody(
    actions,
    "async function assertcanmanagepayablebill",
  );
  const deletePayableBillBody = extractFunctionBody(
    actions,
    "export async function deletepayablebill",
  );
  const getPayableBillsFromClientBody = extractFunctionBody(
    payableReads,
    "export async function getpayablebillsfromclient",
  );

  it("keeps createPayableBill writing organization_id from the active organization", () => {
    expect(createPayableBillBody).toContain("requireorganizationaccess");
    expect(createPayableBillBody).toContain("organization_id: organization.id");
    expect(createPayableBillBody).toContain("assertresponsiblememberbelongstoorganization");
    expect(createPayableBillBody).toContain("assertcanaccessmember");
  });

  it("keeps updatePayableBill preserving organization scope", () => {
    expect(updatePayableBillBody).toContain("assertcanmanagepayablebill");
    expect(updatePayableBillBody).toContain("organization_id: organization.id");
    expect(updatePayableBillBody).toContain("organizationorlegacyfilter(organization.id)");
  });

  it("keeps updatePayableBillStatus preserving organization scope", () => {
    expect(updatePayableBillStatusBody).toContain("assertcanmanagepayablebill");
    expect(updatePayableBillStatusBody).toContain("organization_id: organization.id");
    expect(updatePayableBillStatusBody).toContain("organizationorlegacyfilter(organization.id)");
  });

  it("keeps manage path scoped by owner and transitional organization filter", () => {
    expect(assertCanManagePayableBillBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(assertCanManagePayableBillBody).toContain("organizationorlegacyfilter(organization.id)");
    expect(assertCanManagePayableBillBody).toContain("assertresponsiblememberbelongstoorganization");
    expect(assertCanManagePayableBillBody).toContain("assertcanaccessmember");
  });

  it("keeps delete path scoped by owner and transitional organization filter", () => {
    expect(deletePayableBillBody).toContain("assertcanmanagepayablebill");
    expect(deletePayableBillBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(deletePayableBillBody).toContain("organizationorlegacyfilter(organization.id)");
  });

  it("records that the read path remains transitional", () => {
    expect(getPayableBillsFromClientBody).toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(getPayableBillsFromClientBody).toContain(".in(\"responsible_member_id\", accessiblememberids)");
    expect(audit).toContain("read path relies on accessible members instead of explicit `payable_bills.organization_id` filtering");
  });

  it("keeps the audit as readiness-only, not a hardening migration", () => {
    expect(audit).toContain("this document does not introduce a migration");
    expect(audit).toContain("should not be hardened in this pr");
    expect(audit).toContain("table-scoped null-organization preflight evidence");
    expect(audit).toContain("table-scoped deterministic dry-run evidence");
    expect(audit).toContain("migration-local preflight guard");
    expect(audit).toContain("no runtime, rls, ui, billing or e2e mixing");
  });
});
