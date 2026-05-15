import { describe, expect, it } from "vitest";

import {
  expenseCategories,
  familyMembers,
} from "@/__tests__/fixtures/mock-data";

describe("finance fixtures", () => {
  it("keeps the required default family members", () => {
    expect(familyMembers.map((member) => member.name)).toEqual([
      "Danyel",
      "Pai",
      "Mãe",
      "Gabryel",
      "Caleb",
    ]);
  });

  it("keeps the required default expense categories", () => {
    expect(expenseCategories.length).toBeGreaterThanOrEqual(12);
    expect(expenseCategories.map((category) => category.name)).toContain("Alimentação");
    expect(expenseCategories.map((category) => category.name)).toContain("Outros");
  });
});
