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

  it("documents GAP-015 as planning-only before runtime controls", () => {
    expect(contract).toContain("gap-015");
    expect(contract).toContain("planning only");
    expect(contract).toContain("no runtime change");
    expect(contract).toContain("no schema change");
    expect(contract).toContain("no rls change");
    expect(contract).toContain("no ui change");
    expect(contract).toContain("no billing change");
    expect(contract).toContain("no e2e change");
    expect(contract).toContain("these controls are not implemented yet");
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

    expect(gapRegister).toContain("runtime controls are not implemented");
    expect(roadmap).toContain("planning only, sem runtime, schema, rls, ui, billing ou e2e");
    expect(liveStatus).toContain("runtime controls ainda nao foram implementados");
  });
});
