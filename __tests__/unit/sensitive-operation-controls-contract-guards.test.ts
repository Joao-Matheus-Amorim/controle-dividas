import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("sensitive operation controls contract guards", () => {
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("documents GAP-015 schema progress without claiming runtime controls", () => {
    expect(contract).toContain("gap-015");
    expect(contract).toContain("audit event schema/read-side rls exists in supabase/migrations/040_audit_events_schema.sql");
    expect(contract).toContain("audit event write boundary exists in supabase/migrations/041_audit_events_write_boundary.sql");
    expect(contract).toContain("billing checkout audit runtime exists");
    expect(contract).toContain("admin permission audit runtime exists");
    expect(contract).toContain("no rate limit runtime");
    expect(contract).toContain("no data retention runtime");
    expect(contract).toContain("no ui change");
    expect(contract).toContain("no billing webhook, portal, or commercial enforcement change");
    expect(contract).toContain("no e2e change");
    expect(contract).toContain("remaining runtime controls are not implemented yet");
  });

  it("keeps the three GAP-015 control families explicit", () => {
    expect(contract).toContain("rate limiting");
    expect(contract).toContain("sensitive-action audit logging");
    expect(contract).toContain("data retention policy");
    expect(contract).toContain("operation key");
    expect(contract).toContain("actor identity");
    expect(contract).toContain("organization scope");
    expect(contract).toContain("redaction rules");
    expect(contract).toContain("retention period");
  });

  it("records initial sensitive operation inventory without claiming implementation", () => {
    expect(contract).toContain("auth and session flows");
    expect(contract).toContain("organization administration");
    expect(contract).toContain("billing checkout");
    expect(contract).toContain("app/protected/configuracoes/billing-actions.ts");
    expect(contract).toContain("finance mutations");
    expect(contract).toContain("destructive actions");
    expect(contract).toContain("must be enforced server-side");
    expect(contract).toContain("client-only throttling is not a gap-015 control");
  });

  it("keeps roadmap, live status, and gap register aligned with the contract", () => {
    for (const source of [roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("docs/audits/sensitive_operation_controls_contract.md");
      expect(source).toContain("gap-015");
      expect(source).toContain("rate limiting");
      expect(source).toContain("sensitive-action audit logging");
      expect(source).toContain("data retention");
    }

    expect(gapRegister).toContain("data retention runtime controls are not implemented");
    expect(roadmap).toContain("write boundary de audit events");
    expect(liveStatus).toContain("data retention runtime controls ainda nao foram implementados");
  });
});
