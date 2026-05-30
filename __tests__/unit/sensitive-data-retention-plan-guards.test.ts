import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("sensitive data retention plan guards", () => {
  const plan = read("docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("keeps data retention preflight-only before runtime cleanup", () => {
    expect(plan).toContain("gap-015");
    expect(plan).toContain("audit event retention preflight runtime exists");
    expect(plan).toContain("365-day candidate retention cutoff");
    expect(plan).toContain("no retention cleanup runtime");
    expect(plan).toContain("no cleanup job");
    expect(plan).toContain("no anonymization job");
    expect(plan).toContain("no destructive deletion");
    expect(plan).toContain("data retention cleanup controls are not implemented yet");
    expect(plan).toContain("app/protected/configuracoes/audit-retention-actions.ts");
  });

  it("documents data classes and required retention decisions", () => {
    for (const dataClass of [
      "auth identity",
      "organization membership",
      "financial records",
      "billing references",
      "audit events",
      "operational evidence",
    ]) {
      expect(plan).toContain(dataClass);
    }

    expect(plan).toContain("retention period");
    expect(plan).toContain("deletion, anonymization, or archival behavior");
    expect(plan).toContain("backup/restore implication");
    expect(plan).toContain("rollback or recovery path");
  });

  it("protects destructive retention boundaries", () => {
    expect(plan).toContain("be isolated in its own pr");
    expect(plan).toContain("avoid bundling with rls, billing, ui redesign, or broad refactors");
    expect(plan).toContain("use server-resolved organization scope");
    expect(plan).toContain("avoid trusting `organization_id` supplied by the client");
    expect(plan).toContain("define dry-run or preview behavior");
    expect(plan).toContain("emit an audit event after audit event storage exists");
  });

  it("keeps live docs aligned with the data retention plan", () => {
    for (const source of [contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("docs/audits/sensitive_data_retention_plan.md");
      expect(source).toContain("data retention");
    }

    expect(contract).toContain("when changing data retention behavior");
    expect(roadmap).toContain("plano de data retention");
    expect(liveStatus).toContain("plano de data retention");
    expect(gapRegister).toContain("data retention planning exists");
    expect(gapRegister).toContain("audit event retention preflight runtime");
    expect(gapRegister).toContain("data retention cleanup runtime controls are not implemented");
  });
});
