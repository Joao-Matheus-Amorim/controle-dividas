import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const transitionalTables = [
  "profiles",
  "family_members",
  "expense_categories",
  "expenses",
  "payable_bills",
  "receivable_incomes",
  "banks",
  "user_module_permissions",
  "user_feature_permissions",
] as const;

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function compact(sql: string) {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\r\n]*/g, "");
}

describe("legacy organization_id null backfill readiness", () => {
  const rawMigration = readProjectFile("supabase/migrations/007_add_organization_id_columns.sql");
  const migration = compact(rawMigration);
  const executableMigration = compact(stripSqlComments(rawMigration));

  it.each(transitionalTables)("keeps %s organization_id explicitly transitional in migration 007", (table) => {
    expect(executableMigration).toContain(
      `alter table public.${table} add column if not exists organization_id uuid references public.organizations(id) on delete cascade`,
    );
  });

  it("documents that migration 007 is intentionally non-destructive", () => {
    expect(migration).toContain("does not backfill data");
    expect(migration).toContain("does not make organization_id not null");
  });

  it("does not introduce executable backfill or not-null semantics in the transition migration", () => {
    expect(executableMigration).not.toMatch(/organization_id[^;]*not null/);
    expect(executableMigration).not.toMatch(/update\s+public\.[a-z_]+\s+set\s+organization_id/);
  });

  it("keeps the bootstrap admin profile explicitly organization-less until onboarding assigns scope", () => {
    const bootstrap = readProjectFile("lib/finance/bootstrap-admin-profile.ts");

    expect(bootstrap).toContain("owner_id: authUserId");
    expect(bootstrap).toContain("auth_user_id: authUserId");
    expect(bootstrap).not.toContain("organization_id");
  });
});
