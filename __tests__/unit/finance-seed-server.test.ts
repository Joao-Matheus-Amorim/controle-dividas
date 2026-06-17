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
  it("skips demo member and category seeding when defaults are intentionally empty", async () => {
    const ownerId = "owner-123";
    const organizationId = "org-123";
    const { client, from, upsertCalls } = createSeedClient();

    await seedInitialFinanceDataForOwner(client, ownerId, organizationId);

    expect(buildDefaultFamilyMemberSeedRows(ownerId, organizationId)).toEqual([]);
    expect(buildDefaultExpenseCategorySeedRows(ownerId, organizationId)).toEqual([]);
    expect(from).not.toHaveBeenCalled();
    expect(upsertCalls).toEqual([]);
  });

  it("does not call any seed upsert when no default rows exist", async () => {
    const { client, from } = createSeedClient({
      family_members: { error: { message: "family seed failed" } },
      expense_categories: { error: { message: "category seed failed" } },
    });

    await expect(seedInitialFinanceDataForOwner(client, "owner-123", "org-123")).resolves.toBeUndefined();

    expect(from).not.toHaveBeenCalled();
  });
});
