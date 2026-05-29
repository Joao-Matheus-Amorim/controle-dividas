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

  it("keeps audit event schema progress explicit without claiming broad runtime logging", () => {
    expect(plan).toContain("gap-015");
    expect(plan).toContain("schema migration exists in supabase/migrations/040_audit_events_schema.sql");
    expect(plan).toContain("write boundary exists in supabase/migrations/041_audit_events_write_boundary.sql");
    expect(plan).toContain("billing checkout audit runtime exists");
    expect(plan).toContain("admin permission audit runtime exists");
    expect(plan).toContain("admin user audit runtime exists");
    expect(plan).toContain("read-side rls exists for organization owner/admin");
    expect(plan).toContain("no insert/update/delete policy for authenticated users");
    expect(plan).toContain("audit event storage is versioned");
    expect(plan).toContain("other operation families remain pending");
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
      expect(source).toContain("040_audit_events_schema.sql");
      expect(source).toContain("041_audit_events_write_boundary.sql");
      expect(source).toContain("record_audit_event");
    }

    expect(contract).toContain("when changing audit event behavior");
    expect(roadmap).toContain("schema/read-side rls de audit events");
    expect(liveStatus).toContain("schema/read-side rls de audit events");
    expect(gapRegister).toContain("audit event schema/read-side rls");
    expect(gapRegister).toContain("sensitive-action audit logging runtime");
    expect(gapRegister).toContain("admin permission audit runtime");
    expect(gapRegister).toContain("admin user audit runtime");
  });
});
