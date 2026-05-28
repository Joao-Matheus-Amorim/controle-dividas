import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const cleanupMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/039_drop_legacy_owner_family_policies.sql"),
  "utf8",
);

const legacyPolicyDrops = [
  ["family_members", "family_members_select_own"],
  ["family_members", "family_members_insert_own"],
  ["family_members", "family_members_update_own"],
  ["family_members", "family_members_delete_own"],
  ["expense_categories", "expense_categories_select_own"],
  ["expense_categories", "expense_categories_insert_own"],
  ["expense_categories", "expense_categories_update_own"],
  ["expense_categories", "expense_categories_delete_own"],
  ["expenses", "expenses_select_own"],
  ["expenses", "expenses_insert_own"],
  ["expenses", "expenses_update_own"],
  ["expenses", "expenses_delete_own"],
  ["payable_bills", "payable_bills_select_own"],
  ["payable_bills", "payable_bills_insert_own"],
  ["payable_bills", "payable_bills_update_own"],
  ["payable_bills", "payable_bills_delete_own"],
  ["receivable_incomes", "receivable_incomes_select_own"],
  ["receivable_incomes", "receivable_incomes_insert_own"],
  ["receivable_incomes", "receivable_incomes_update_own"],
  ["receivable_incomes", "receivable_incomes_delete_own"],
  ["banks", "banks_select_own"],
  ["banks", "banks_insert_own"],
  ["banks", "banks_update_own"],
  ["banks", "banks_delete_own"],
  ["profiles", "profiles_select_family"],
  ["profiles", "profiles_insert_family"],
  ["profiles", "profiles_update_family"],
  ["profiles", "profiles_delete_family"],
  ["user_module_permissions", "permissions_select_family"],
  ["user_module_permissions", "permissions_insert_family"],
  ["user_module_permissions", "permissions_update_family"],
  ["user_module_permissions", "permissions_delete_family"],
  ["user_feature_permissions", "feature_permissions_select_family"],
  ["user_feature_permissions", "feature_permissions_insert_family"],
  ["user_feature_permissions", "feature_permissions_update_family"],
  ["user_feature_permissions", "feature_permissions_delete_family"],
] as const;

describe("legacy owner/family policy cleanup migration", () => {
  it.each(legacyPolicyDrops)("drops %s policy %s idempotently", (table, policy) => {
    expect(cleanupMigration).toContain(
      `drop policy if exists "${policy}" on public.${table};`,
    );
  });

  it("does not create replacement policies or change schema", () => {
    expect(cleanupMigration).not.toMatch(/\bcreate\s+policy\b/i);
    expect(cleanupMigration).not.toMatch(/\balter\s+table\b/i);
  });
});
