import { describe, expect, it, vi } from "vitest";

import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

function createSeedClient(
  results: Partial<
    Record<"family_members" | "expense_categories", { error: { message: string } | null }>
  > = {},
  existingExpenseCategoryCount = 0,
) {
  const upsertCalls: Array<{ table: string; rows: unknown[]; options: unknown }> = [];
  const insertCalls: Array<{ table: string; rows: unknown[] }> = [];
  const from = vi.fn((table: "family_members" | "expense_categories") => ({
    upsert: vi.fn(async (rows: unknown[], options: unknown) => {
      upsertCalls.push({ table, rows, options });
      return results[table] ?? { error: null };
    }),
    insert: vi.fn(async (rows: unknown[]) => {
      insertCalls.push({ table, rows });
      return results[table] ?? { error: null };
    }),
    select: vi.fn(() => ({
      eq: vi.fn(async () => ({
        count: existingExpenseCategoryCount,
        error: null,
      })),
    })),
  }));

  return { client: { from }, from, upsertCalls, insertCalls };
}

describe("finance seed server", () => {
  it("seeds default root categories when the organization has no categories yet", async () => {
    const ownerId = "owner-123";
    const organizationId = "org-123";
    const { client, from, upsertCalls, insertCalls } = createSeedClient();

    await seedInitialFinanceDataForOwner(client, ownerId, organizationId);

    expect(buildDefaultFamilyMemberSeedRows(ownerId, organizationId)).toEqual([]);
    expect(buildDefaultExpenseCategorySeedRows(ownerId, organizationId)).toHaveLength(20);
    expect(from).toHaveBeenCalledWith("expense_categories");
    expect(upsertCalls).toEqual([]);
    expect(insertCalls).toEqual([
      {
        table: "expense_categories",
        rows: buildDefaultExpenseCategorySeedRows(ownerId, organizationId),
      },
    ]);
  });

  it("does not insert default categories when the organization already has categories", async () => {
    const { client, insertCalls } = createSeedClient({}, 1);

    await expect(seedInitialFinanceDataForOwner(client, "owner-123", "org-123")).resolves.toBeUndefined();

    expect(insertCalls).toEqual([]);
  });
});
