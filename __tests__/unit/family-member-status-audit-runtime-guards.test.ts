import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function functionBlock(source: string, functionName: string) {
  const startToken = `export async function ${functionName}`;
  const start = source.indexOf(startToken);

  expect(start, `missing function ${functionName}`).toBeGreaterThanOrEqual(0);

  const next = source.indexOf("\nexport async function ", start + startToken.length);

  return source.slice(start, next >= 0 ? next : source.length);
}

describe("family member status audit runtime guards", () => {
  const peopleActions = read("app/protected/pessoas/actions.ts");
  const statusControls = read("lib/finance/member-status-controls.ts");
  const toggleAction = functionBlock(peopleActions, "togglefamilymemberstatus");
  const actions = [peopleActions, statusControls].join("\n");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records member status updates through shared audit and rate limit boundaries", () => {
    expect(actions).toContain("recordfamilymemberstatusauditevent");
    expect(actions).toContain("finance.member.status.update");
    expect(actions).toContain('targettype: "family_member"');
    expect(actions).toContain("checksensitiveoperationratelimit");
    expect(actions).toContain('operationkey: "finance.member.status.update"');
    expect(toggleAction).toContain('select("id, is_active")');
    expect(toggleAction).toContain('formdata.get("is_active")');
    expect(toggleAction).toContain('!["true", "false"].includes(submittedactivevalue)');
    expect(toggleAction).toContain("status invalido para esta pessoa");
    expect(toggleAction).toContain("const currentactive = boolean(member.is_active)");
    expect(toggleAction).toContain("currentactive !== submittedactive");
    expect(toggleAction).toContain("o status desta pessoa mudou");
    expect(toggleAction).toContain("actorkey: profile.owner_id");
    expect(toggleAction).toContain("organizationid: organization.id");
    expect(toggleAction).toContain("targetkey: id");
    expect(toggleAction).toContain('update({');
    expect(toggleAction).toContain('{ count: "exact" }');
    expect(toggleAction).toContain("if (count !== 1)");
    expect(toggleAction).toContain('outcome: "denied"');
    expect(toggleAction).toContain("rate_limited");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("status_changed");
    expect(actions).not.toContain("previous_active");
    expect(actions).not.toContain("next_active");
    expect(actions).not.toContain("previous_status");
    expect(actions).not.toContain("next_status");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
  });

  it("keeps docs aligned with member status runtime coverage", () => {
    for (const source of [schemaPlan, rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.member.status.update");
    }

    for (const source of [rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("member status rate limit runtime");
    }

    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("member status audit runtime");
    }
  });
});
