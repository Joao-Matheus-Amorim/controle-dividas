import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsDir = "supabase/migrations";
const migrationPath = "supabase/migrations/021_family_members_organization_scope_hardening.sql";
const runbookPath = "docs/runbooks/FAMILY_MEMBERS_ORG_SCOPE_HARDENING.md";
const seedPayloadsPath = "lib/finance/seed-payloads.ts";
const seedServerPath = "lib/finance/seed-server.ts";

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

function migrationVersion(filename: string) {
  return filename.match(/^(\d+)_/)?.[1] ?? null;
}

describe("family_members organization scope hardening", () => {
  const rawMigration = read(migrationPath);
  const executableMigration = compact(stripSqlComments(rawMigration));
  const runbook = compact(read(runbookPath));
  const seedPayloads = compact(read(seedPayloadsPath));
  const seedServer = compact(read(seedServerPath));

  it("uses a unique migration version prefix", () => {
    const migrationFiles = readdirSync(join(process.cwd(), migrationsDir)).filter((filename) =>
      filename.endsWith(".sql"),
    );
    const versions = migrationFiles.map((filename) => migrationVersion(filename)).filter(Boolean);
    const duplicateVersions = versions.filter(
      (version, index) => versions.indexOf(version) !== index,
    );

    expect(duplicateVersions).toEqual([]);
    expect(migrationFiles).toContain(basename(migrationPath));
  });

  it("targets only family_members organization_id", () => {
    expect(executableMigration).toContain("from public.family_members");
    expect(executableMigration).toContain("alter table public.family_members");
    expect(executableMigration).toContain("alter column organization_id set not null");
    expect(executableMigration).not.toContain("public.profiles");
    expect(executableMigration).not.toContain("public.expense_categories");
    expect(executableMigration).not.toContain("public.expenses");
    expect(executableMigration).not.toContain("public.payable_bills");
    expect(executableMigration).not.toContain("public.receivable_incomes");
    expect(executableMigration).not.toContain("public.banks");
    expect(executableMigration).not.toContain("public.user_module_permissions");
    expect(executableMigration).not.toContain("public.user_feature_permissions");
  });

  it("fails before hardening if null organization rows still exist", () => {
    const guardPosition = executableMigration.indexOf("if exists");
    const constraintPosition = executableMigration.indexOf("alter table public.family_members");

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

  it("documents required checks, rollback expectation, and seed compatibility", () => {
    expect(runbook).toContain("supabase/migrations/021_family_members_organization_scope_hardening.sql");
    expect(runbook).toContain("docs/sql/legacy-organization-null-preflight.sql");
    expect(runbook).toContain("docs/sql/legacy-organization-backfill-dry-run.sql");
    expect(runbook).toContain("builddefaultfamilymemberseedrows(ownerid, organizationid)");
    expect(runbook).toContain("organization_id: organizationid");
    expect(runbook).toContain("rollback is schema-only");
  });

  it("keeps default family member seeds organization scoped", () => {
    expect(seedPayloads).toContain("builddefaultfamilymemberseedrows( ownerid: string, organizationid: string,");
    expect(seedPayloads).toContain("organization_id: organizationid");
    expect(seedServer).toContain("builddefaultfamilymemberseedrows(ownerid, organizationid)");
  });
});
