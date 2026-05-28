import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("sensitive-action audit event schema plan guards", () => {
  const plan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("keeps audit event planning explicit without claiming runtime logging", () => {
    expect(plan).toContain("gap-015");
    expect(plan).toContain("planning only");
    expect(plan).toContain("no audit_events table");
    expect(plan).toContain("no migration");
    expect(plan).toContain("no runtime logging");
    expect(plan).toContain("no rls policy");
    expect(plan).toContain("audit logging is not implemented yet");
  });

  it("defines the minimum event shape decisions for a future schema PR", () => {
    for (const field of [
      "id",
      "occurred_at",
      "actor_user_id",
      "organization_id",
      "action",
      "target_type",
      "target_id",
      "outcome",
      "request_id",
      "metadata",
    ]) {
      expect(plan).toContain(field);
    }

    expect(plan).toContain("actor, organization, action, target, outcome, correlation, and safe metadata");
  });

  it("protects operation keys and redaction boundaries", () => {
    expect(plan).toContain("billing.checkout.start");
    expect(plan).toContain("admin.permission.update");
    expect(plan).toContain("finance.expense.delete");
    expect(plan).toContain("finance.payable.status.update");
    expect(plan).toContain("forbidden metadata examples");
    expect(plan).toContain("passwords");
    expect(plan).toContain("stripe secret keys");
    expect(plan).toContain("full financial payloads");
    expect(plan).toContain("free-form notes");
    expect(plan).toContain("full before/after row snapshots");
  });

  it("keeps live docs aligned with the audit event schema plan", () => {
    for (const source of [contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("docs/audits/sensitive_action_audit_event_schema_plan.md");
    }

    expect(contract).toContain("when changing audit event behavior");
    expect(roadmap).toContain("plano de schema/redaction para audit events");
    expect(liveStatus).toContain("plano de schema/redaction para audit events");
    expect(gapRegister).toContain("audit event schema/redaction planning");
    expect(gapRegister).toContain("runtime controls are not implemented");
  });
});
