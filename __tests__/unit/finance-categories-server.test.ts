import { describe, expect, it, vi } from "vitest";

import { getExpenseCategoriesByOwnerFromClient } from "@/lib/finance/categories-server";

function createExpenseCategoriesClient(
  data: unknown[] | null,
  error: { message: string } | null = null,
) {
  const order = vi.fn(async () => ({ data, error }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: { from },
    calls: { from, select, eq, order },
  };
}

describe("finance categories server", () => {
  it("reads expense categories scoped by owner and ordered by name", async () => {
    const ownerId = "owner-123";
    const categoryRows = [
      {
        id: "category-1",
        owner_id: ownerId,
        name: "Alimentação",
        description: "Gastos com alimentação",
        is_default: true,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    const { client, calls } = createExpenseCategoriesClient(categoryRows);

    const result = await getExpenseCategoriesByOwnerFromClient(client, ownerId);

    expect(result).toEqual(categoryRows);
    expect(calls.from).toHaveBeenCalledWith("expense_categories");
    expect(calls.select).toHaveBeenCalledWith(
      "id, owner_id, name, description, is_default, created_at",
    );
    expect(calls.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(calls.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("returns an empty list when Supabase returns null data", async () => {
    const { client } = createExpenseCategoriesClient(null);

    await expect(getExpenseCategoriesByOwnerFromClient(client, "owner-123")).resolves.toEqual(
      [],
    );
  });

  it("throws Supabase read errors", async () => {
    const { client } = createExpenseCategoriesClient(null, { message: "read failed" });

    await expect(getExpenseCategoriesByOwnerFromClient(client, "owner-123")).rejects.toThrow(
      "read failed",
    );
  });
});
