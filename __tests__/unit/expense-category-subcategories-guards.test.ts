import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("expense category subcategory guards", () => {
  it("keeps the migration enforcing same-organization root parents", () => {
    const migration = readSource("supabase/migrations/062_expense_category_subcategories.sql");

    expect(migration).toContain("parent_category_id uuid");
    expect(migration).toContain("expense_categories_parent_category_id_fkey");
    expect(migration).toContain("expense_categories_parent_not_self_check");
    expect(migration).toContain("expense_category_parent_matches_organization");
    expect(migration).toContain("parent_category.organization_id = new.organization_id");
    expect(migration).toContain("parent_category.parent_category_id is null");
    expect(migration).toContain("child_category.parent_category_id = new.id");
    expect(migration).toContain("drop index if exists public.expense_categories_owner_name_unique_idx");
    expect(migration).toContain("expense_categories_organization_root_name_unique_idx");
    expect(migration).toContain("where parent_category_id is null");
    expect(migration).toContain("expense_categories_organization_parent_name_unique_idx");
    expect(migration).toContain("where parent_category_id is not null");
  });

  it("keeps category writes validating parent_category_id before mutation", () => {
    const actions = readSource("app/protected/configuracoes/actions.ts");

    expect(actions).toContain('formData.get("parent_category_id")');
    expect(actions).toContain("validateExpenseCategoryParent");
    expect(actions).toContain("parentCategoryId === currentCategoryId");
    expect(actions).toContain("parentCategory.parent_category_id");
    expect(actions).toContain('eq("parent_category_id", currentCategoryId)');
    expect(actions).toContain("parent_category_id: input.parentCategoryId || null");
  });

  it("keeps settings and expense surfaces using hierarchical category labels", () => {
    const settings = readSource("components/settings/settings-categories.tsx");
    const expenseForm = readSource("components/finance/expense-form.tsx");
    const expenseList = readSource("components/finance/expense-list-client.tsx");

    expect(settings).toContain("buildExpenseCategoryLabelMap(categories)");
    expect(settings).toContain("Subcategoria de");
    expect(expenseForm).toContain("categoryLabels.get(category.id)");
    expect(expenseList).toContain("categoryLabels.get(expense.category_id)");
  });
});
