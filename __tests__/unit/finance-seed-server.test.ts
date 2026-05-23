import { describe, expect, it, vi } from "vitest";

import { seedInitialFinanceDataForOwner } from "@/lib/finance/seed-server";
import {
  buildDefaultExpenseCategorySeedRows,
  buildDefaultFamilyMemberSeedRows,
} from "@/lib/finance/seed-payloads";

describe("finance seed server", () => {
  it("upserts default members and categories with duplicate-safe options", async () => {
    const ownerId = "owner-123";
    const upsertCalls: Array<{ table: string; rows: unknown[]; options: unknown }> = [];
    const from = vi.fn((table: "family_members" | "expense_categories") => ({
      upsert: vi.fn(async (rows: unknown[], options: unknown) => {
        upsertCalls.push({ table, rows, options });
        return { error: null };
      }),
    }));

    await seedInitialFinanceDataForOwner({ from }, ownerId);

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
});
