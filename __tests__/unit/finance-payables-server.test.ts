import { describe, expect, it, vi } from "vitest";

import { getPayableBillsFromClient } from "@/lib/finance/payables-server";

function createPayableBillsClient(data: unknown[] | null, error: { message: string } | null = null) {
  const orderCreatedAt = vi.fn(async () => ({ data, error }));
  const orderDueDate = vi.fn(() => ({ order: orderCreatedAt }));
  const inFilter = vi.fn(() => ({ order: orderDueDate }));
  const eq = vi.fn(() => ({ in: inFilter }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    client: { from },
    calls: { from, select, eq, inFilter, orderDueDate, orderCreatedAt },
  };
}

describe("finance payables server", () => {
  it("returns an empty list without querying when no member ids are accessible", async () => {
    const { client, calls } = createPayableBillsClient([]);

    await expect(
      getPayableBillsFromClient(client, { owner_id: "owner-123" }, []),
    ).resolves.toEqual([]);

    expect(calls.from).not.toHaveBeenCalled();
  });

  it("reads payable bills scoped by owner and accessible member ids", async () => {
    const ownerId = "owner-123";
    const accessibleMemberIds = ["member-1", "member-2"];
    const billRows = [
      {
        id: "bill-1",
        owner_id: ownerId,
        name: "Aluguel",
        category: "Moradia",
        amount: 1200,
        due_date: "2026-05-10",
        responsible_member_id: "member-1",
        status: "pendente",
        bill_type: "fixa",
        bank_used: "Banco",
        recurrence: "mensal",
        notes: "nota",
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: [{ id: "member-1", name: "Member 1" }],
      },
    ];
    const { client, calls } = createPayableBillsClient(billRows);

    const result = await getPayableBillsFromClient(
      client,
      { owner_id: ownerId },
      accessibleMemberIds,
    );

    expect(result).toEqual([
      {
        ...billRows[0],
        family_members: { id: "member-1", name: "Member 1" },
      },
    ]);
    expect(calls.from).toHaveBeenCalledWith("payable_bills");
    expect(calls.select).toHaveBeenCalledWith(
      "id, owner_id, name, category, amount, due_date, responsible_member_id, status, bill_type, bank_used, recurrence, notes, created_at, family_members(id, name)",
    );
    expect(calls.eq).toHaveBeenCalledWith("owner_id", ownerId);
    expect(calls.inFilter).toHaveBeenCalledWith("responsible_member_id", accessibleMemberIds);
    expect(calls.orderDueDate).toHaveBeenCalledWith("due_date", { ascending: true });
    expect(calls.orderCreatedAt).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("keeps object relation shapes and applies bill type fallback", async () => {
    const billRows = [
      {
        id: "bill-1",
        owner_id: "owner-123",
        name: "Conta avulsa",
        category: "Casa",
        amount: 100,
        due_date: "2026-05-10",
        responsible_member_id: "member-1",
        status: "pendente",
        bill_type: null,
        bank_used: null,
        recurrence: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-1", name: "Member 1" },
      },
    ];
    const { client } = createPayableBillsClient(billRows);

    await expect(
      getPayableBillsFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).resolves.toEqual([
      {
        ...billRows[0],
        bill_type: "avulsa",
      },
    ]);
  });

  it("returns an empty list when Supabase returns null data", async () => {
    const { client } = createPayableBillsClient(null);

    await expect(
      getPayableBillsFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).resolves.toEqual([]);
  });

  it("throws Supabase read errors", async () => {
    const { client } = createPayableBillsClient(null, { message: "read failed" });

    await expect(
      getPayableBillsFromClient(client, { owner_id: "owner-123" }, ["member-1"]),
    ).rejects.toThrow("read failed");
  });
});
