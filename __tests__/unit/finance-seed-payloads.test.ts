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
  const organizationId = "org-123";

  it("builds organization-scoped duplicate-safe default family member seed rows", () => {
    const rows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);

    expect(rows).toHaveLength(defaultFamilyMembers.length);
    expect(rows).toEqual(
      defaultFamilyMembers.map((member) => ({
        owner_id: ownerId,
        organization_id: organizationId,
        name: member.name,
        role: member.role,
        monthly_limit: member.monthlyLimit,
        currency: member.currency,
        is_active: true,
      })),
    );
  });

  it("builds organization-scoped duplicate-safe default expense category seed rows", () => {
    const rows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);

    expect(rows).toHaveLength(defaultExpenseCategories.length);
    expect(rows).toEqual(
      defaultExpenseCategories.map((category) => ({
        owner_id: ownerId,
        organization_id: organizationId,
        name: category.name,
        is_default: true,
      })),
    );
  });

  it("uses the provided owner id for every seed row", () => {
    const memberRows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);
    const categoryRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);

    expect(memberRows.every((row) => row.owner_id === ownerId)).toBe(true);
    expect(categoryRows.every((row) => row.owner_id === ownerId)).toBe(true);
  });

  it("uses the provided organization id for every seed row", () => {
    const memberRows = buildDefaultFamilyMemberSeedRows(ownerId, organizationId);
    const categoryRows = buildDefaultExpenseCategorySeedRows(ownerId, organizationId);

    expect(memberRows.every((row) => row.organization_id === organizationId)).toBe(true);
    expect(categoryRows.every((row) => row.organization_id === organizationId)).toBe(true);
  });
});
