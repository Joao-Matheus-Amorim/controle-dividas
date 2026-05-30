import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing checkout audit runtime guards", () => {
  const action = read("app/protected/configuracoes/billing-actions.ts");
  const auditHelper = read("lib/audit/events.ts");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const controlsContract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records billing checkout audit events through the server write boundary", () => {
    expect(action).toContain("recordauditevent");
    expect(action).toContain("billing.checkout.start");
    expect(action).toContain("billing.checkout.failed");
    expect(action).toContain('targettype: "billing_checkout"');
    expect(action).toContain('outcome: "success"');
    expect(action).toContain("getcheckoutauditoutcome");
    expect(action).toContain("missing_price_env_var");
  });

  it("keeps audit helper scoped to the record_audit_event RPC", () => {
    expect(auditHelper).toContain('supabase.rpc("record_audit_event"');
    expect(auditHelper).toContain("p_organization_id");
    expect(auditHelper).toContain("p_action");
    expect(auditHelper).toContain("p_target_type");
    expect(auditHelper).toContain("p_outcome");
    expect(auditHelper).toContain("p_metadata");
    expect(auditHelper).toContain("return false");
    expect(auditHelper).not.toContain("service_role");
  });

  it("keeps checkout audit runtime free of webhook, portal, and retention work", () => {
    for (const source of [action, auditHelper]) {
      expect(source).not.toContain("stripe.webhooks");
      expect(source).not.toContain("billing portal");
      expect(source).not.toContain("retention");
      expect(source).not.toContain("setinterval");
      expect(source).not.toContain("cron");
    }
  });

  it("keeps live docs aligned with billing checkout audit runtime", () => {
    for (const source of [schemaPlan, controlsContract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("billing checkout audit runtime");
      expect(source).toContain("record_audit_event");
    }

    expect(gapRegister).toContain("bank audit runtime");
    expect(gapRegister).toContain("category delete audit runtime");
    expect(gapRegister).toContain("billing checkout rate limit runtime");
    expect(gapRegister).toContain("remaining broader rate limiting and data retention cleanup runtime controls are not implemented");
    expect(roadmap).toContain("sem webhook, portal ou retention");
    expect(liveStatus).toContain("sem webhook, portal ou retention");
  });
});
