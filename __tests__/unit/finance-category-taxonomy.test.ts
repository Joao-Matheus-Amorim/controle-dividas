import { describe, expect, it } from "vitest";

import {
  type CategoryAncestryNode,
  isTransferCategoryName,
  isTransferCategoryOrDescendant,
} from "@/lib/finance/category-taxonomy";

describe("finance category taxonomy", () => {
  it("identifies transfer categories by name and descendants by ancestry", () => {
    const transferCategory: CategoryAncestryNode = {
      id: "transferencias",
      name: "Transferencias",
      parent_category_id: null,
    };
    const transferChildCategory: CategoryAncestryNode = {
      id: "wise",
      name: "Wise",
      parent_category_id: transferCategory.id,
    };
    const otherCategory: CategoryAncestryNode = {
      id: "alimentacao",
      name: "Alimentacao",
      parent_category_id: null,
    };
    const categoriesById = new Map<string, CategoryAncestryNode>([
      [transferCategory.id, transferCategory],
      [transferChildCategory.id, transferChildCategory],
      [otherCategory.id, otherCategory],
    ]);

    expect(isTransferCategoryName("Transferencias")).toBe(true);
    expect(isTransferCategoryOrDescendant(transferCategory, categoriesById)).toBe(true);
    expect(isTransferCategoryOrDescendant(transferChildCategory, categoriesById)).toBe(true);
    expect(isTransferCategoryOrDescendant(otherCategory, categoriesById)).toBe(false);
  });
});
