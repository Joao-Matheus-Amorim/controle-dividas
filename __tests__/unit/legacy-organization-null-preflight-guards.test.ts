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

function readPreflight() {
  return readFileSync(
    join(process.cwd(), "docs/sql/legacy-organization-null-preflight.sql"),
    "utf8",
  );
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, ""))
    .join("\n");
}

function compact(sql: string) {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("legacy organization_id null preflight SQL", () => {
  const rawSql = readPreflight();
  const executableSql = compact(stripSqlComments(rawSql));

  it("is read-only executable SQL", () => {
    expect(executableSql).toMatch(/^select\b/);
    expect(executableSql).not.toMatch(destructiveSqlPattern);
  });

  it.each(transitionalTables)("counts null organization rows for %s", (table) => {
    expect(executableSql).toContain(`'${table}' as table_name`);
    expect(executableSql).toContain(`from public.${table}`);
    expect(executableSql).toContain("where organization_id is null");
  });

  it("returns one grouped result set ordered by table", () => {
    const selectCount = executableSql.match(/\bselect\b/g)?.length ?? 0;
    expect(selectCount).toBe(transitionalTables.length);
    expect(executableSql).toContain("union all");
    expect(executableSql).toContain("order by table_name");
  });
});
