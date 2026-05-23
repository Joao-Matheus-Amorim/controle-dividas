import { describe, expect, it, vi } from "vitest";

import { getExpensesFromClient } from "@/lib/finance/expenses-server";

function createExpensesClient(data: unknown[] | null, error: { message: string } | null = null) {
  const orderCreatedAt = vi.fn(async () => ({ data, error }));
  const orderExpenseDate = vi.fn(() => ({ order: orderCreatedAt }));
  const inFilter = vi.fn(() => ({ order: orderExpenseDate }));
  const eq = vi.fn(() => ({ in: inFilter }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: { from },
    calls: { from, select, eq, inFilter, orderExpenseDate, orderCreatedAt },
  };
}

describe("finance expenses server", () => {
  it("returns an empty list without querying when no member ids are accessible", async () => {
    const { client, calls } = createExpensesClient([]);

    await expect(
      getExpensesFromClient(client, { owner_id: "owner-123" }, []),
    ).resolves.toEqual([]);

    expect(calls.from).not.toHaveBeenCalled();
  });

  it("reads expenses scoped by owner and accessible member ids", async () => {
    const ownerId = "owner-123";
    const accessibleMemberIds = ["member-1", "member-2"];
    const expenseRows = [
      {
        id: "expense-1",
        owner_id: ownerId,
        family_member_id: "member-1",
        category_id: "category-1",
        expense_date: "2026-05-01",
        description: "Mercado",
        purchase_location: "Supermercado",
        amount: 123.45,
        payment_method: "cartao",
        bank_or_card: "Banco",
        notes: "nota",
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: [{ id: "member-1", name: "Member 1", monthly_limit: 1000 }],
        expense_categories: [{ id: "category-1", name: "Alimentação" }],
      },
    ];
    const { client, calls } = createExpensesClient(expenseRows);

    const result = await getExpensesFromClient(
      client,
      { owner_id: ownerId },
      accessibleMemberIds,
    );

    expect(result).toEqual([
      {
        ...expenseRows[0],
        family_members: { id: "member-1", name: "Member 1", monthly_limit: 1000 },
        expense_categories: { id: "category-1", name: "Alimentação" },
      },
    ]);
    expect(calls.from).toHaveBeenCalledWith("expenses");
    expect(calls.select).toHaveBeenCalledWith(
      "id, owner_id, family_member_id, category_id, expense_date, description, purchase_location, amount, payment_method, bank_or_card, notes, created_at, family_members(id, name, monthly_limit), expense_categories(id, name)",
    );
    expect(calls.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(calls.inFilter).toHaveBeenCalledWith("family_member_id", accessibleMemberIds);
    expect(calls.orderExpenseDate).toHaveBeenCalledWith("expense_date", { ascending: false });
    expect(calls.orderCreatedAt).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("keeps object relation shapes when Supabase returns objects", async () => {
    const expenseRows = [
      {
        id: "expense-1",
        owner_id: "owner-123",
        family_member_id: "member-1",
        category_id: "category-1",
        expense_date: "2026-05-01",
        description: "Mercado",
        purchase_location: null,
        amount: 123.45,
        payment_method: "pix",
        bank_or_card: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-1", name: "Member 1", monthly_limit: 1000 },
        expense_categories: { id: "category-1", name: "Alimentação" },
      },
    ];
    const { client } = createExpensesClient(expenseRows);

    await expect(
      getExpensesFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).resolves.toEqual(expenseRows);
  });

  it("returns an empty list when Supabase returns null data", async () => {
    const { client } = createExpensesClient(null);

    await expect(
      getExpensesFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).resolves.toEqual([]);
  });

  it("throws Supabase read errors", async () => {
    const { client } = createExpensesClient(null, { message: "read failed" });

    await expect(
      getExpensesFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).rejects.toThrow("read failed");
  });
});
