import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/018_expense_categories_organization_scope_hardening.sql";
const runbookPath = "docs/runbooks/EXPENSE_CATEGORIES_ORG_SCOPE_HARDENING.md";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, ""))
    .join("\n");
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("expense_categories organization scope hardening", () => {
  const rawMigration = read(migrationPath);
  const executableMigration = compact(stripSqlComments(rawMigration));
  const runbook = compact(read(runbookPath));

  it("targets only expense_categories organization_id", () => {
    expect(executableMigration).toContain("from public.expense_categories");
    expect(executableMigration).toContain("alter table public.expense_categories");
    expect(executableMigration).toContain("alter column organization_id set not null");
    expect(executableMigration).not.toContain("public.profiles");
    expect(executableMigration).not.toContain("public.family_members");
    expect(executableMigration).not.toContain("public.expenses");
    expect(executableMigration).not.toContain("public.payable_bills");
    expect(executableMigration).not.toContain("public.receivable_incomes");
    expect(executableMigration).not.toContain("public.banks");
    expect(executableMigration).not.toContain("public.user_module_permissions");
    expect(executableMigration).not.toContain("public.user_feature_permissions");
  });

  it("fails before hardening if null organization rows still exist", () => {
    const guardPosition = executableMigration.indexOf("if exists");
    const constraintPosition = executableMigration.indexOf("alter table public.expense_categories");

    expect(guardPosition).toBeGreaterThanOrEqual(0);
    expect(constraintPosition).toBeGreaterThan(guardPosition);
    expect(executableMigration).toContain("where organization_id is null");
    expect(executableMigration).toContain("raise exception");
  });

  it("does not mutate data", () => {
    expect(executableMigration).not.toMatch(/\bupdate\b/);
    expect(executableMigration).not.toMatch(/\binsert\b/);
    expect(executableMigration).not.toMatch(/\bdelete\b/);
    expect(executableMigration).not.toMatch(/\btruncate\b/);
    expect(executableMigration).not.toMatch(/\bdrop\b/);
  });

  it("documents rollback and required pre-apply checks", () => {
    expect(runbook).toContain("docs/sql/legacy-organization-null-preflight.sql");
    expect(runbook).toContain("docs/sql/legacy-organization-backfill-dry-run.sql");
    expect(runbook).toContain("rollback is schema-only");
    expect(runbook).toContain("alter column organization_id drop not null");
  });
});
