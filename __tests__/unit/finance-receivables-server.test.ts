import { describe, expect, it, vi } from "vitest";

import { getReceivableIncomesFromClient } from "@/lib/finance/receivables-server";

function createReceivableIncomesClient(
  data: unknown[] | null,
  error: { message: string } | null = null,
) {
  const orderCreatedAt = vi.fn(async () => ({ data, error }));
  const orderExpectedDate = vi.fn(() => ({ order: orderCreatedAt }));
  const inFilter = vi.fn(() => ({ order: orderExpectedDate }));
  const eq = vi.fn(() => ({ in: inFilter }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: { from },
    calls: { from, select, eq, inFilter, orderExpectedDate, orderCreatedAt },
  };
}

describe("finance receivables server", () => {
  it("returns an empty list without querying when no member ids are accessible", async () => {
    const { client, calls } = createReceivableIncomesClient([]);

    await expect(
      getReceivableIncomesFromClient(client, { owner_id: "owner-123" }, []),
    ).resolves.toEqual([]);

    expect(calls.from).not.toHaveBeenCalled();
  });

  it("reads receivable incomes scoped by owner and accessible member ids", async () => {
    const ownerId = "owner-123";
    const accessibleMemberIds = ["member-1", "member-2"];
    const incomeRows = [
      {
        id: "income-1",
        owner_id: ownerId,
        receiver_member_id: "member-1",
        source: "Salário",
        income_type: "fixa",
        amount: 5000,
        expected_date: "2026-05-10",
        status: "previsto",
        receiving_bank: "Banco",
        notes: "nota",
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: [{ id: "member-1", name: "Member 1" }],
      },
    ];
    const { client, calls } = createReceivableIncomesClient(incomeRows);

    const result = await getReceivableIncomesFromClient(
      client,
      { owner_id: ownerId },
      accessibleMemberIds,
    );

    expect(result).toEqual([
      {
        ...incomeRows[0],
        family_members: { id: "member-1", name: "Member 1" },
      },
    ]);
    expect(calls.from).toHaveBeenCalledWith("receivable_incomes");
    expect(calls.select).toHaveBeenCalledWith(
      "id, owner_id, receiver_member_id, source, income_type, amount, expected_date, status, receiving_bank, notes, created_at, family_members(id, name)",
    );
    expect(calls.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(calls.inFilter).toHaveBeenCalledWith("receiver_member_id", accessibleMemberIds);
    expect(calls.orderExpectedDate).toHaveBeenCalledWith("expected_date", { ascending: true });
    expect(calls.orderCreatedAt).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("keeps object relation shapes when Supabase returns objects", async () => {
    const incomeRows = [
      {
        id: "income-1",
        owner_id: "owner-123",
        receiver_member_id: "member-1",
        source: "Freelance",
        income_type: "variavel",
        amount: 1000,
        expected_date: "2026-05-10",
        status: "recebido",
        receiving_bank: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-1", name: "Member 1" },
      },
    ];
    const { client } = createReceivableIncomesClient(incomeRows);

    await expect(
      getReceivableIncomesFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).resolves.toEqual(incomeRows);
  });

  it("returns an empty list when Supabase returns null data", async () => {
    const { client } = createReceivableIncomesClient(null);

    await expect(
      getReceivableIncomesFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).resolves.toEqual([]);
  });

  it("throws Supabase read errors", async () => {
    const { client } = createReceivableIncomesClient(null, { message: "read failed" });

    await expect(
      getReceivableIncomesFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).rejects.toThrow("read failed");
  });
});
