import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const candidateTables = [
  "family_members",
  "expense_categories",
  "expenses",
  "payable_bills",
  "receivable_incomes",
  "banks",
  "user_module_permissions",
  "user_feature_permissions",
  "profiles",
] as const;

function readPlan() {
  return readFileSync(
    join(process.cwd(), "docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md"),
    "utf8",
  );
}

function normalize(text: string) {
  return text.toLowerCase();
}

describe("organization scope hardening plan", () => {
  const plan = normalize(readPlan());

  it.each(candidateTables)("lists %s as a hardening candidate or special-case table", (table) => {
    expect(plan).toContain(`\`${table}\``);
  });

  it("requires fresh preflight and dry-run evidence before future schema hardening", () => {
    expect(plan).toContain("docs/sql/legacy-organization-null-preflight.sql");
    expect(plan).toContain("docs/sql/legacy-organization-backfill-dry-run.sql");
    expect(plan).toContain("zero null-organization rows");
    expect(plan).toContain("zero blocked rows");
    expect(plan).toContain("zero ambiguous rows");
  });

  it("keeps profiles as a special-case blocker until bootstrap organization assignment is resolved", () => {
    expect(plan).toContain("profiles blocker");
    expect(plan).toContain("bootstrap/admin profile creation");
    expect(plan).toContain("before hardening `profiles`");
    expect(plan).toContain("profiles` remains transitional");
  });

  it("requires rollback planning for the future schema migration", () => {
    expect(plan).toContain("rollback expectations");
    expect(plan).toContain("the exact constraint or schema change to revert");
    expect(plan).toContain("validation queries after rollback");
    expect(plan).toContain("revert the pr");
  });

  it("prevents mixing schema hardening with unrelated runtime, policy, ui, billing, or e2e work", () => {
    expect(plan).toContain("runtime");
    expect(plan).toContain("rls");
    expect(plan).toContain("ui");
    expect(plan).toContain("billing");
    expect(plan).toContain("e2e");
  });

  it("states that this planning PR does not change data, migrations, policies, or schema nullability", () => {
    expect(plan).toContain("planning-only");
    expect(plan).toContain("does not apply schema changes");
    expect(plan).toContain("does not update data");
    expect(plan).toContain("does not change rls policies");
    expect(plan).toContain("schema nullability");
  });
});
