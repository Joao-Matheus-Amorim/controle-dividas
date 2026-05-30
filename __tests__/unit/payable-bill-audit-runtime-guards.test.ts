import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("payable bill audit runtime guards", () => {
  const actions = read("app/protected/contas-a-pagar/actions.ts");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records payable status and delete events through the audit write boundary", () => {
    expect(actions).toContain("recordpayablebillauditevent");
    expect(actions).toContain("finance.payable.status.update");
    expect(actions).toContain("finance.payable.delete");
    expect(actions).toContain('targettype: "payable_bill"');
    expect(actions).toContain('outcome = "success"');
    expect(actions).toContain("checksensitiveoperationratelimit");
    expect(actions).toContain('operationkey: "finance.payable.status.update"');
    expect(actions).toContain('operationkey: "finance.payable.delete"');
    expect(actions).toContain("actorkey: profile.id");
    expect(actions).toContain("organizationid: organization.id");
    expect(actions).toContain("targetkey: id");
    expect(actions).toContain('delete({ count: "exact" })');
    expect(actions).toContain("if (count !== 1)");
    expect(actions).toContain('outcome: "denied"');
    expect(actions).toContain("rate_limited");

    const deleteRateLimitStart = actions.indexOf("...payabledeleteratelimit");
    const deleteRateLimitBody = actions.slice(
      deleteRateLimitStart,
      actions.indexOf("if (!ratelimit.allowed)", deleteRateLimitStart),
    );

    expect(deleteRateLimitBody).toContain("actorkey: profile.id");
    expect(deleteRateLimitBody).toContain("organizationid: organization.id");
    expect(deleteRateLimitBody).not.toContain("targetkey");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("next_status");
    expect(actions).toContain("responsible_member_id");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
    expect(actions).not.toContain("full financial payload");
  });

  it("keeps docs aligned with payable audit runtime and remaining finance work", () => {
    for (const source of [roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("payable bill audit runtime");
      expect(source).toContain("finance.payable.status.update");
      expect(source).toContain("finance.payable.delete");
    }

    expect(gapRegister).toContain("bank audit runtime");
    expect(gapRegister).toContain("category delete audit runtime");
    expect(gapRegister).toContain("billing checkout rate limit runtime");
    expect(gapRegister).toContain("payable delete rate limit runtime");
    expect(gapRegister).toContain("payable status rate limit runtime");
    expect(roadmap).toContain("remaining broader rate limiting e data retention cleanup ainda nao tem runtime implementado");
    expect(liveStatus).toContain("remaining broader rate limiting e data retention cleanup runtime controls ainda nao foram implementados");
  });
});
