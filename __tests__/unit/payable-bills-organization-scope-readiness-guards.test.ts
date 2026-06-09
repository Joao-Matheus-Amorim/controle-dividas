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
  const payableReads = read("lib/organizations/payables.ts");
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
  const getOrganizationPayableBillsBody = extractFunctionBody(
    payableReads,
    "export async function getorganizationpayablebills",
  );

  it("keeps createPayableBill writing organization_id from the active organization", () => {
    expect(createPayableBillBody).toContain("requireorganizationaccess");
    expect(createPayableBillBody).toContain("organization_id: organization.id");
    expect(createPayableBillBody).toContain("owner_id: organization.owner_auth_user_id");
    expect(createPayableBillBody).not.toContain("owner_id: profile.owner_id");
    expect(createPayableBillBody).toContain("assertresponsiblememberbelongstoorganization");
    expect(createPayableBillBody).toContain("assertcanaccessmember");
  });

  it("keeps updatePayableBill preserving organization scope", () => {
    expect(updatePayableBillBody).toContain("assertcanmanagepayablebill");
    expect(updatePayableBillBody).toContain("organization_id: organization.id");
    expect(updatePayableBillBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps updatePayableBillStatus preserving organization scope", () => {
    expect(updatePayableBillStatusBody).toContain("assertcanmanagepayablebill");
    expect(updatePayableBillStatusBody).toContain("organization_id: organization.id");
    expect(updatePayableBillStatusBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("keeps manage path scoped by active organization", () => {
    expect(assertCanManagePayableBillBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(assertCanManagePayableBillBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(assertCanManagePayableBillBody).toContain("assertresponsiblememberbelongstoorganization");
    expect(assertCanManagePayableBillBody).toContain("assertcanaccessmember");
  });

  it("keeps delete path scoped by active organization", () => {
    expect(deletePayableBillBody).toContain("assertcanmanagepayablebill");
    expect(deletePayableBillBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(deletePayableBillBody).toContain(".eq(\"organization_id\", organization.id)");
  });

  it("records that the read path is organization scoped", () => {
    expect(getOrganizationPayableBillsBody).not.toContain(".eq(\"owner_id\", profile.owner_id)");
    expect(getOrganizationPayableBillsBody).toContain(".eq(\"organization_id\", organization.id)");
    expect(getOrganizationPayableBillsBody).toContain(".in(\"responsible_member_id\", accessiblememberids)");
    expect(audit).toContain("read path filters `payable_bills.organization_id` and accessible members");
  });

  it("records the payable write boundary migration contract", () => {
    expect(audit).toContain("supabase/migrations/053_payable_bills_organization_write_rls.sql");
    expect(audit).toContain("owner_id remains a legacy schema column");
    expect(audit).toContain("organization.owner_auth_user_id");
    expect(audit).toContain("contas_a_pagar");
    expect(audit).toContain("schema-final owner_id removal remains out of scope");
  });
});
