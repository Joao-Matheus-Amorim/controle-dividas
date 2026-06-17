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

describe("expense write audit runtime guards", () => {
  const actions = read("app/protected/gastos/actions.ts");
  const createAction = functionBlock(actions, "createexpense");
  const updateAction = functionBlock(actions, "updateexpense");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records expense create and update events through audit and rate limit boundaries", () => {
    expect(actions).toContain("recordexpenseauditevent");
    expect(actions).toContain("finance.expense.create");
    expect(actions).toContain("finance.expense.update");
    expect(actions).toContain('targettype: "expense"');
    expect(actions).toContain('operationkey: "finance.expense.create"');
    expect(actions).toContain('operationkey: "finance.expense.update"');

    expect(createAction).toContain("expensecreateratelimit");
    expect(createAction).toContain("checksensitiveoperationratelimit");
    expect(createAction).toContain("actorkey: profile.id");
    expect(createAction).toContain("organizationid: organization.id");
    expect(createAction).not.toContain("targetkey:");
    expect(createAction).toContain('supabase.rpc("create_expense_with_movement"');
    expect(createAction).toContain("target_organization_id: organization.id");
    expect(createAction).toContain("target_owner_id: organization.owner_auth_user_id");
    expect(createAction).toContain("target_bank_id: input.bankid");
    expect(createAction).toContain("expense_created");
    expect(createAction).toContain('outcome: "denied"');

    expect(updateAction).toContain("expenseupdateratelimit");
    expect(updateAction).toContain("checksensitiveoperationratelimit");
    expect(updateAction).toContain("actorkey: profile.id");
    expect(updateAction).toContain("organizationid: organization.id");
    expect(updateAction).toContain("targetkey: id");
    expect(updateAction).toContain('{ count: "exact" }');
    expect(updateAction).toContain("if (count !== 1)");
    expect(updateAction).toContain("expense_changed");
    expect(updateAction).toContain('outcome: "denied"');
    expect(updateAction).toContain("rate_limited");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("expense_created");
    expect(actions).toContain("expense_changed");
    expect(actions).toContain("family_member_id");
    expect(actions).not.toContain("previous_amount");
    expect(actions).not.toContain("next_amount");
    expect(actions).not.toContain("previous_description");
    expect(actions).not.toContain("next_description");
    expect(actions).not.toContain("previous_notes");
    expect(actions).not.toContain("next_notes");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
  });

  it("keeps docs aligned with expense write runtime coverage", () => {
    for (const source of [schemaPlan, rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.expense.create");
      expect(source).toContain("finance.expense.update");
    }

    for (const source of [rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("expense write rate limit runtime");
    }

    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("expense write audit runtime");
    }
  });
});
