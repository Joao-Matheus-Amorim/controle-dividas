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
  it("upserts organization-scoped default categories without seeding demo members", async () => {
    const ownerId = "owner-123";
    const organizationId = "org-123";
    const { client, from, upsertCalls } = createSeedClient();

    await seedInitialFinanceDataForOwner(client, ownerId, organizationId);

    expect(buildDefaultFamilyMemberSeedRows(ownerId, organizationId)).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenNthCalledWith(1, "expense_categories");
    expect(upsertCalls).toEqual([
      {
        table: "expense_categories",
        rows: buildDefaultExpenseCategorySeedRows(ownerId, organizationId),
        options: { onConflict: "owner_id,name", ignoreDuplicates: true },
      },
    ]);
  });

  it("does not call family member seed when no default members exist", async () => {
    const { client, from } = createSeedClient({
      family_members: { error: { message: "family seed failed" } },
    });

    await expect(seedInitialFinanceDataForOwner(client, "owner-123", "org-123")).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("expense_categories");
  });

  it("throws when default category seed upsert fails", async () => {
    const { client, from } = createSeedClient({
      expense_categories: { error: { message: "category seed failed" } },
    });

    await expect(seedInitialFinanceDataForOwner(client, "owner-123", "org-123")).rejects.toThrow(
      "category seed failed",
    );

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenNthCalledWith(1, "expense_categories");
  });
});
