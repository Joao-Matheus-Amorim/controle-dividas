import type { DbExpenseCategory } from "@/lib/finance/types";

export function getExpenseCategoryLabel(
  category: DbExpenseCategory,
  categoriesById: Map<string, DbExpenseCategory>,
) {
  if (!category.parent_category_id) {
    return category.name;
  }

  const parent = categoriesById.get(category.parent_category_id);

  return parent ? `${parent.name} / ${category.name}` : category.name;
}

export function buildExpenseCategoryLabelMap(categories: DbExpenseCategory[]) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return new Map(
    categories.map((category) => [
      category.id,
      getExpenseCategoryLabel(category, categoriesById),
    ]),
  );
}
