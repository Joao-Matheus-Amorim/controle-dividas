import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/025_banks_organization_scope_hardening.sql";
const runbookPath = "docs/runbooks/BANKS_ORG_SCOPE_HARDENING.md";
const forbiddenTables = ["expenses", "payable_bills", "receivable_incomes"] as const;

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

function withoutComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, ""))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

function version(filename: string) {
  return filename.match(/^(\d+)_/)?.[1] ?? null;
}

function expectNoForbiddenTableReferences(sql: string) {
  for (const table of forbiddenTables) {
    expect(sql).not.toContain(`public.${table}`);
    expect(sql).not.toContain(`"public"."${table}"`);
  }
}

describe("banks organization scope hardening", () => {
  const migration = withoutComments(read(migrationPath));
  const runbook = read(runbookPath);

  it("uses a unique migration version prefix", () => {
    const migrationFiles = readdirSync(join(process.cwd(), "supabase/migrations")).filter((file) =>
      file.endsWith(".sql"),
    );
    const versions = migrationFiles.map(version).filter(Boolean);
    const duplicateVersions = versions.filter((item, index) => versions.indexOf(item) !== index);

    expect(duplicateVersions).toEqual([]);
    expect(migrationFiles).toContain(basename(migrationPath));
  });

  it("targets only banks organization_id", () => {
    expect(migration).toContain('from "public"."banks"');
    expect(migration).toContain('alter table "public"."banks"');
    expect(migration).toContain('alter column "organization_id" set not null');
    expectNoForbiddenTableReferences(migration);
  });

  it("fails before hardening if null organization rows still exist", () => {
    expect(migration.indexOf("if exists")).toBeGreaterThanOrEqual(0);
    expect(migration.indexOf('alter table "public"."banks"')).toBeGreaterThan(
      migration.indexOf("if exists"),
    );
    expect(migration).toContain('where "organization_id" is null');
    expect(migration).toContain("raise exception");
  });

  it("does not backfill rows", () => {
    expect(migration).not.toMatch(/\bupdate\b/);
    expect(migration).not.toMatch(/\binsert\b/);
    expect(migration).not.toMatch(/\bdelete\b/);
  });

  it("documents required checks and rollback expectation", () => {
    expect(runbook).toContain(migrationPath);
    expect(runbook).toContain("docs/sql/banks-organization-null-preflight.sql");
    expect(runbook).toContain("docs/sql/banks-organization-dry-run.sql");
    expect(runbook).toContain("null_organization_rows = 0");
    expect(runbook).toContain("rollback is schema-only");
    expect(runbook).toContain("back to nullable");
  });
});
