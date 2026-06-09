import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("family member limit audit runtime guards", () => {
  const settingsActions = read("app/protected/configuracoes/actions.ts");
  const peopleActions = read("app/protected/pessoas/actions.ts");
  const memberLimitControls = read("lib/finance/member-limit-controls.ts");
  const actions = [settingsActions, peopleActions, memberLimitControls].join("\n");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records member limit updates through shared audit and rate limit boundaries", () => {
    expect(actions).toContain("recordfamilymemberlimitauditevent");
    expect(actions).toContain("finance.member.limit.update");
    expect(actions).toContain('targettype: "family_member"');
    expect(actions).toContain("checksensitiveoperationratelimit");
    expect(actions).toContain('operationkey: "finance.member.limit.update"');
    expect(actions).toContain("actorkey: profile.id");
    expect(actions).toContain("organizationid: organization.id");
    expect(actions).toContain("targetkey: id");
    expect(actions).toContain('outcome: "denied"');
    expect(actions).toContain("rate_limited");
    expect(actions).toContain("if (count !== 1)");
  });

  it("covers both settings and people edit mutation paths", () => {
    for (const source of [settingsActions, peopleActions]) {
      expect(source).toContain("requireorganizationadmin");
      expect(source).toContain("recordfamilymemberlimitauditevent");
      expect(source).toContain("checksensitiveoperationratelimit");
      expect(source).toContain("targetkey: id");
      expect(source).toContain("limit_changed");
      expect(source).not.toContain('.eq("owner_id", profile.owner_id)');
    }
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("limit_changed");
    expect(actions).not.toContain("previous_limit");
    expect(actions).not.toContain("next_limit");
    expect(actions).not.toContain("previous_value");
    expect(actions).not.toContain("next_value");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
  });

  it("keeps docs aligned with member limit runtime coverage", () => {
    for (const source of [schemaPlan, rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.member.limit.update");
    }

    for (const source of [rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("member limit rate limit runtime");
    }

    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("member limit audit runtime");
    }
  });
});
