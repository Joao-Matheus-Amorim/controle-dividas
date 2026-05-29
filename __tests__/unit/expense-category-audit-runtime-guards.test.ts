import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("expense category audit runtime guards", () => {
  const actions = read("app/protected/configuracoes/actions.ts");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records category delete events through the audit write boundary", () => {
    expect(actions).toContain("recordexpensecategoryauditevent");
    expect(actions).toContain("finance.category.delete");
    expect(actions).toContain('targettype: "expense_category"');
    expect(actions).toContain('delete({ count: "exact" })');
    expect(actions).toContain("if (count !== 1)");
    expect(actions).toContain('outcome: "success"');
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).not.toContain("previous");
    expect(actions).not.toContain("next");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
    expect(actions).not.toContain("full financial payload");
  });

  it("keeps docs aligned with category audit runtime and remaining GAP-015 work", () => {
    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.category.delete");
    }

    for (const source of [roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("category delete audit runtime");
      expect(source).toContain("rate limiting");
      expect(source).toContain("data retention");
    }
  });
});
