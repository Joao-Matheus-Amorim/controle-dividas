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

describe("expense category audit runtime guards", () => {
  const actions = read("app/protected/configuracoes/actions.ts");
  const deleteExpenseCategoryAction = functionBlock(actions, "deleteexpensecategory");
  const schemaPlan = read("docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("records category delete events through the audit write boundary", () => {
    expect(actions).toContain("recordexpensecategoryauditevent");
    expect(actions).toContain('targettype: "expense_category"');
    expect(actions).toContain('outcome = "success"');
    expect(actions).toContain('operationkey: "finance.category.delete"');
    expect(deleteExpenseCategoryAction).toContain("requireorganizationadmin");
    expect(deleteExpenseCategoryAction).toContain("checksensitiveoperationratelimit");
    expect(deleteExpenseCategoryAction).toContain("actorkey: currentuserid");
    expect(deleteExpenseCategoryAction).not.toContain('eq("owner_id"');
    expect(deleteExpenseCategoryAction).toContain("organizationid: organization.id");
    expect(deleteExpenseCategoryAction).not.toContain("targetkey: id");
    expect(deleteExpenseCategoryAction).toContain('delete({ count: "exact" })');
    expect(deleteExpenseCategoryAction).toContain("if (count !== 1)");
    expect(deleteExpenseCategoryAction).toContain('outcome: "denied"');
    expect(deleteExpenseCategoryAction).toContain("rate_limited");
  });

  it("keeps emitted metadata redacted and small", () => {
    expect(actions).not.toContain("previous_value");
    expect(actions).not.toContain("next_value");
    expect(actions).not.toContain("before");
    expect(actions).not.toContain("after");
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
      expect(source).toContain("category delete rate limit runtime");
      expect(source).toContain("rate limiting");
      expect(source).toContain("data retention");
    }
  });
});
