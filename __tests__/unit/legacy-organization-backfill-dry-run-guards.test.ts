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

const destructiveSqlPattern =
  /\b(insert|update|delete|alter|drop|truncate|create|grant|revoke|merge|call)\b/i;

function readDryRun() {
  return readFileSync(
    join(process.cwd(), "docs/sql/legacy-organization-backfill-dry-run.sql"),
    "utf8",
  );
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\r\n]*/g, "");
}

function compact(sql: string) {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("legacy organization backfill dry-run SQL", () => {
  const rawSql = readDryRun();
  const executableSql = compact(stripSqlComments(rawSql));

  it("is read-only executable SQL", () => {
    expect(executableSql).toMatch(/^with\b/);
    expect(executableSql).not.toMatch(destructiveSqlPattern);
  });

  it.each(transitionalTables)("includes %s legacy null rows in the dry-run", (table) => {
    expect(executableSql).toContain(`'${table}' as table_name`);
    expect(executableSql).toContain(`from public.${table}`);
    expect(executableSql).toContain("where organization_id is null");
  });

  it("emits zero-count rows for empty transitional tables", () => {
    expect(executableSql).toContain("transitional_tables as");
    expect(executableSql).toContain("from transitional_tables");
    expect(executableSql).toContain("left join legacy_mapping_summary");
    expect(executableSql).toContain("order by transitional_tables.sort_order");
    expect(executableSql).toContain("coalesce(legacy_mapping_summary.total_legacy_null_organization_rows, 0)");
    expect(executableSql).toContain("coalesce(legacy_mapping_summary.deterministically_mappable_rows, 0)");
    expect(executableSql).toContain("coalesce(legacy_mapping_summary.blocked_missing_owner_profile_rows, 0)");
    expect(executableSql).toContain("coalesce(legacy_mapping_summary.blocked_owner_without_organization_rows, 0)");
    expect(executableSql).toContain("coalesce(legacy_mapping_summary.blocked_ambiguous_owner_organization_rows, 0)");
  });

  it("uses owner/profile organization mapping without updating rows", () => {
    expect(executableSql).toContain("owner_organization_mapping");
    expect(executableSql).toContain("from public.profiles");
    expect(executableSql).toContain("owner_id");
    expect(executableSql).toContain("organization_id is not null");
    expect(executableSql).toContain("count(distinct organization_id)");
  });

  it("reports mappable and blocked categories", () => {
    expect(executableSql).toContain("total_legacy_null_organization_rows");
    expect(executableSql).toContain("deterministically_mappable_rows");
    expect(executableSql).toContain("blocked_missing_owner_profile_rows");
    expect(executableSql).toContain("blocked_owner_without_organization_rows");
    expect(executableSql).toContain("blocked_ambiguous_owner_organization_rows");
  });

  it("keeps deterministic mapping strict", () => {
    expect(executableSql).toContain("distinct_organizations = 1");
    expect(executableSql).toContain("distinct_organizations > 1");
  });
});
