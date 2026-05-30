import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("audit event retention preflight guards", () => {
  const actions = read("app/protected/configuracoes/audit-retention-actions.ts");
  const plan = read("docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("keeps audit event retention preflight read-only and organization-scoped", () => {
    expect(actions).toContain("getauditeventretentionpreflight");
    expect(actions).toContain('dataclass: "audit_events"');
    expect(actions).toContain("retentiondays: 365");
    expect(actions).toContain("requireorganizationadmin");
    expect(actions).not.toContain("requireorganizationaccess");
    expect(actions).toContain('from("audit_events")');
    expect(actions).toContain('select("id", { count: "exact", head: true })');
    expect(actions).toContain('eq("organization_id", organization.id)');
    expect(actions).toContain('lt("occurred_at", cutoffiso)');
    expect(actions).toContain("destructiveaction: false");
    expect(actions).not.toContain(".delete(");
    expect(actions).not.toContain(".update(");
    expect(actions).not.toContain(".insert(");
    expect(actions).not.toContain(".rpc(");
  });

  it("keeps docs aligned with audit event retention preflight and remaining retention work", () => {
    for (const source of [plan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("audit event retention preflight");
      expect(source).toContain("365");
      expect(source).toContain("owner/admin");
    }

    for (const source of [plan, contract, roadmap, liveStatus]) {
      expect(source).toContain("audit events");
    }

    expect(gapRegister).toContain("audit_events");

    expect(plan).toContain("no cleanup job");
    expect(plan).toContain("no destructive deletion");
    expect(contract).toContain("no cleanup job");
    expect(contract).toContain("no destructive deletion");
    expect(roadmap).toContain("sem cleanup job ou destructive deletion");

    expect(gapRegister).toContain("without cleanup or destructive deletion");
    expect(gapRegister).toContain("data retention cleanup runtime controls are not implemented");
  });
});
