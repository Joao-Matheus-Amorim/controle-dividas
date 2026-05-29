import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("bank audit runtime guards", () => {
  const actions = read("app/protected/bancos/actions.ts");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records bank balance and delete events through the audit write boundary", () => {
    expect(actions).toContain("recordbankauditevent");
    expect(actions).toContain("finance.bank.balance.update");
    expect(actions).toContain("finance.bank.delete");
    expect(actions).toContain('delete({ count: "exact" })');
    expect(actions).toContain('targettype: "bank"');
    expect(actions).toContain('outcome: "success"');
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("previous_balance");
    expect(actions).toContain("next_balance");
    expect(actions).toContain("family_member_id");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
    expect(actions).not.toContain("full financial payload");
  });

  it("keeps docs aligned with bank audit runtime and remaining GAP-015 work", () => {
    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.bank.balance.update");
      expect(source).toContain("finance.bank.delete");
    }

    for (const source of [roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("bank audit runtime");
      expect(source).toContain("rate limiting");
      expect(source).toContain("data retention");
    }
  });
});
