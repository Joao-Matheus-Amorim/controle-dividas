import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "supabase/migrations");
const revokeMigrationPath = join(
  migrationsDir,
  "055_revoke_anon_select_sensitive_tables.sql",
);

function read(path: string) {
  return readFileSync(path, "utf8").toLowerCase();
}

describe("anonymous table privilege guards", () => {
  it("revokes anonymous access from sensitive application tables", () => {
    const migration = read(revokeMigrationPath);

    [
      "banks",
      "expense_categories",
      "expenses",
      "family_members",
      "organization_memberships",
      "organizations",
      "payable_bills",
      "profiles",
      "receivable_incomes",
      "user_feature_permissions",
      "user_module_permissions",
    ].forEach((table) => {
      expect(migration).toContain(`'${table}'`);
    });

    expect(migration).toContain("revoke all on table public.%i from public");
    expect(migration).toContain("revoke all on table public.%i from anon");
    expect(migration).toContain(
      "grant select, insert, update, delete on table public.%i to authenticated",
    );
  });

  it("does not reintroduce direct anonymous table grants in newer migrations", () => {
    const newerMigrations = readdirSync(migrationsDir).filter(
      (file) => file >= "055_revoke_anon_select_sensitive_tables.sql",
    );

    const forbiddenGrantPattern =
      /grant\s+(?:all|select|insert|update|delete|[^;]*select[^;]*)\s+on\s+(?:table\s+)?public\.[\w_]+\s+to\s+anon\b/;

    newerMigrations.forEach((file) => {
      const sql = read(join(migrationsDir, file));
      expect(sql, `Unexpected direct anon table grant in ${file}`).not.toMatch(
        forbiddenGrantPattern,
      );
    });
  });
});
