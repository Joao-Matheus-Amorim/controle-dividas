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

describe("legacy organization_id null backfill readiness", () => {
  const migration = compact(
    readProjectFile("supabase/migrations/007_add_organization_id_columns.sql"),
  );

  it.each(transitionalTables)("keeps %s organization_id explicitly transitional in migration 007", (table) => {
    expect(migration).toContain(
      `alter table public.${table} add column if not exists organization_id uuid references public.organizations(id) on delete cascade`,
    );
  });

  it("does not introduce backfill or not-null semantics in the transition migration", () => {
    expect(migration).toContain("does not backfill data");
    expect(migration).toContain("does not make organization_id not null");
    expect(migration).not.toMatch(/organization_id[^;]*not null/);
    expect(migration).not.toMatch(/update\s+public\.[a-z_]+\s+set\s+organization_id/);
  });

  it("keeps the bootstrap admin profile explicitly organization-less until onboarding assigns scope", () => {
    const bootstrap = readProjectFile("lib/finance/bootstrap-admin-profile.ts");

    expect(bootstrap).toContain("owner_id: authUserId");
    expect(bootstrap).toContain("auth_user_id: authUserId");
    expect(bootstrap).not.toContain("organization_id");
  });
});
