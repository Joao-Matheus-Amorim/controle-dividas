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

describe("bank write audit runtime guards", () => {
  const actions = read("app/protected/bancos/actions.ts");
  const createAction = functionBlock(actions, "createbankaccount");
  const updateAction = functionBlock(actions, "updatebankaccount");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records bank create and update events through audit and rate limit boundaries", () => {
    expect(actions).toContain("recordbankauditevent");
    expect(actions).toContain("finance.bank.create");
    expect(actions).toContain("finance.bank.update");
    expect(actions).toContain('targettype: "bank"');
    expect(actions).toContain('operationkey: "finance.bank.create"');
    expect(actions).toContain('operationkey: "finance.bank.update"');

    expect(createAction).toContain("bankcreateratelimit");
    expect(createAction).toContain("checksensitiveoperationratelimit");
    expect(createAction).toContain("actorkey: profile.id");
    expect(createAction).toContain("organizationid: organization.id");
    expect(createAction).not.toContain("targetkey:");
    expect(createAction).toContain('.from("banks").insert({');
    expect(createAction).toContain('.select("id").single()');
    expect(createAction).toContain("bank_created");

    expect(updateAction).toContain("const bankchanged");
    expect(updateAction).toContain("bankupdateratelimit");
    expect(updateAction).toContain("checksensitiveoperationratelimit");
    expect(updateAction).toContain("actorkey: profile.id");
    expect(updateAction).toContain("organizationid: organization.id");
    expect(updateAction).toContain("targetkey: id");
    expect(updateAction).toContain('{ count: "exact" }');
    expect(updateAction).toContain("if (count !== 1)");
    expect(updateAction).toContain("bank_changed");
    expect(updateAction).toContain('outcome: "denied"');
    expect(updateAction).toContain("rate_limited");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("bank_created");
    expect(actions).toContain("bank_changed");
    expect(actions).toContain("family_member_id");
    expect(actions).not.toContain("previous_balance");
    expect(actions).not.toContain("next_balance");
    expect(actions).not.toContain("previous_bank_name");
    expect(actions).not.toContain("next_bank_name");
    expect(actions).not.toContain("previous_notes");
    expect(actions).not.toContain("next_notes");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
  });

  it("keeps docs aligned with bank write runtime coverage", () => {
    for (const source of [schemaPlan, rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.bank.create");
      expect(source).toContain("finance.bank.update");
    }

    for (const source of [rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("bank write rate limit runtime");
    }

    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("bank write audit runtime");
    }
  });
});
