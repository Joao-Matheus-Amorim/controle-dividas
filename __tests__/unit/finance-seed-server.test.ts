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
) {
  const upsertCalls: Array<{ table: string; rows: unknown[]; options: unknown }> = [];
  const from = vi.fn((table: "family_members" | "expense_categories") => ({
    upsert: vi.fn(async (rows: unknown[], options: unknown) => {
      upsertCalls.push({ table, rows, options });
      return results[table] ?? { error: null };
    }),
  }));

  return { client: { from }, from, upsertCalls };
}

describe("finance seed server", () => {
  it("upserts default members and categories with duplicate-safe options", async () => {
    const ownerId = "owner-123";
    const { client, from, upsertCalls } = createSeedClient();

    await seedInitialFinanceDataForOwner(client, ownerId);

    expect(from).toHaveBeenNthCalledWith(1, "family_members");
    expect(from).toHaveBeenNthCalledWith(2, "expense_categories");
    expect(upsertCalls).toEqual([
      {
        table: "family_members",
        rows: buildDefaultFamilyMemberSeedRows(ownerId),
        options: { onConflict: "owner_id,name", ignoreDuplicates: true },
      },
      {
        table: "expense_categories",
        rows: buildDefaultExpenseCategorySeedRows(ownerId),
        options: { onConflict: "owner_id,name", ignoreDuplicates: true },
      },
    ]);
  });

  it("throws when default member seed upsert fails", async () => {
    const { client, from } = createSeedClient({
      family_members: { error: { message: "family seed failed" } },
    });

    await expect(seedInitialFinanceDataForOwner(client, "owner-123")).rejects.toThrow(
      "family seed failed",
    );

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("family_members");
  });

  it("throws when default category seed upsert fails", async () => {
    const { client, from } = createSeedClient({
      expense_categories: { error: { message: "category seed failed" } },
    });

    await expect(seedInitialFinanceDataForOwner(client, "owner-123")).rejects.toThrow(
      "category seed failed",
    );

    expect(from).toHaveBeenNthCalledWith(1, "family_members");
    expect(from).toHaveBeenNthCalledWith(2, "expense_categories");
  });
});
