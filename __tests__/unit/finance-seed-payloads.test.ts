import { describe, expect, it } from "vitest";

import {
  defaultExpenseCategories,
  defaultFamilyMembers,
} from "@/lib/finance/default-seed-data";
import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

describe("finance seed payload builders", () => {
  const ownerId = "owner-123";

  it("builds duplicate-safe default family member seed rows", () => {
    const rows = buildDefaultFamilyMemberSeedRows(ownerId);

    expect(rows).toHaveLength(defaultFamilyMembers.length);
    expect(rows).toEqual(
      defaultFamilyMembers.map((member) => ({
        owner_id: ownerId,
        name: member.name,
        role: member.role,
        monthly_limit: member.monthlyLimit,
        currency: member.currency,
        is_active: true,
      })),
    );
  });

  it("builds duplicate-safe default expense category seed rows", () => {
    const rows = buildDefaultExpenseCategorySeedRows(ownerId);

    expect(rows).toHaveLength(defaultExpenseCategories.length);
    expect(rows).toEqual(
      defaultExpenseCategories.map((category) => ({
        owner_id: ownerId,
        name: category.name,
        is_default: true,
      })),
    );
  });

  it("uses the provided owner id for every seed row", () => {
    const memberRows = buildDefaultFamilyMemberSeedRows(ownerId);
    const categoryRows = buildDefaultExpenseCategorySeedRows(ownerId);

    expect(memberRows.every((row) => row.owner_id === ownerId)).toBe(true);
    expect(categoryRows.every((row) => row.owner_id === ownerId)).toBe(true);
  });
});
