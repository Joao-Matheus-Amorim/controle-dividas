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

describe("expense category write audit runtime guards", () => {
  const actions = read("app/protected/configuracoes/actions.ts");
  const createAction = functionBlock(actions, "createexpensecategory");
  const updateAction = functionBlock(actions, "updateexpensecategory");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records category create and update events through audit and rate limit boundaries", () => {
    expect(actions).toContain("recordexpensecategoryauditevent");
    expect(actions).toContain("finance.category.create");
    expect(actions).toContain("finance.category.update");
    expect(actions).toContain('targettype: "expense_category"');
    expect(actions).toContain('operationkey: "finance.category.create"');
    expect(actions).toContain('operationkey: "finance.category.update"');

    expect(createAction).toContain("categorycreateratelimit");
    expect(createAction).toContain("requireorganizationadmin");
    expect(createAction).toContain("checksensitiveoperationratelimit");
    expect(createAction).toContain("actorkey: currentuserid");
    expect(createAction).toContain("owner_id: organization.owner_auth_user_id");
    expect(createAction).toContain("organizationid: organization.id");
    expect(createAction).not.toContain("targetkey:");
    expect(createAction).toContain(".select(\"id\").single()");
    expect(createAction).toContain("category_created");

    expect(updateAction).toContain('select("id, name, description, is_default")');
    expect(updateAction).toContain("requireorganizationadmin");
    expect(updateAction).toContain("const categorychanged");
    expect(updateAction).toContain("categoryupdateratelimit");
    expect(updateAction).toContain("actorkey: currentuserid");
    expect(updateAction).not.toContain("owner_id:");
    expect(updateAction).not.toContain('eq("owner_id"');
    expect(updateAction).toContain("targetkey: id");
    expect(updateAction).toContain('{ count: "exact" }');
    expect(updateAction).toContain("if (count !== 1)");
    expect(updateAction).toContain("category_changed");
    expect(updateAction).toContain('outcome: "denied"');
    expect(updateAction).toContain("rate_limited");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).toContain("category_created");
    expect(actions).toContain("category_changed");
    expect(actions).not.toContain("previous_name");
    expect(actions).not.toContain("next_name");
    expect(actions).not.toContain("previous_description");
    expect(actions).not.toContain("next_description");
    expect(actions).not.toContain("full_payload");
    expect(actions).not.toContain("raw_payload");
  });

  it("keeps docs aligned with category write runtime coverage", () => {
    for (const source of [schemaPlan, rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("finance.category.create");
      expect(source).toContain("finance.category.update");
    }

    for (const source of [rateLimitPlan, contract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("category write rate limit runtime");
    }

    for (const source of [schemaPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("category write audit runtime");
    }
  });
});
