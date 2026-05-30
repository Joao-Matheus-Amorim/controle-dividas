import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("expense audit runtime guards", () => {
  const actions = read("app/protected/gastos/actions.ts");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records expense delete events through the audit write boundary", () => {
    expect(actions).toContain("recordexpenseauditevent");
    expect(actions).toContain("finance.expense.delete");
    expect(actions).toContain('delete({ count: "exact" })');
    expect(actions).toContain("if (count !== 1)");
    expect(actions).toContain('targettype: "expense"');
    expect(actions).toContain('outcome = "success"');
    expect(actions).toContain("checksensitiveoperationratelimit");
    expect(actions).toContain('operationkey: "finance.expense.delete"');
    expect(actions).toContain('outcome: "denied"');
    expect(actions).toContain("rate_limited");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("family_member_id");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
    expect(actions).not.toContain("full financial payload");
  });

  it("keeps docs aligned with expense audit runtime and remaining finance work", () => {
    for (const source of [roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("expense audit runtime");
      expect(source).toContain("finance.expense.delete");
    }

    expect(gapRegister).toContain("bank audit runtime");
    expect(gapRegister).toContain("category delete audit runtime");
    expect(gapRegister).toContain("billing checkout rate limit runtime");
    expect(gapRegister).toContain("expense delete rate limit runtime");
    expect(roadmap).toContain("remaining broader rate limiting e data retention cleanup ainda nao tem runtime implementado");
    expect(liveStatus).toContain("remaining broader rate limiting e data retention cleanup runtime controls ainda nao foram implementados");
  });
});
