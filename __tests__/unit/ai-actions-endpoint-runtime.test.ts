import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/organizations/revalidation", () => ({
  revalidateOrganizationPaths: vi.fn(),
}));

function createMockSupabase() {
  const deleteResult = Promise.resolve({ data: null, error: null, count: 1 }) as Promise<{ data: null; error: null; count: number }> & { eq: ReturnType<typeof vi.fn> };
  deleteResult.eq = vi.fn(() => deleteResult);

  const queryChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn(() => deleteResult),
    single: vi.fn().mockResolvedValue({ data: { id: "new-id" } as Record<string, unknown>, error: null }),
  };

  return {
    from: vi.fn(() => queryChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

describe("AI actions handlers", () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let ctx: Record<string, unknown>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    ctx = {
      profileId: "profile-1",
      organizationId: "org-1",
      ownerAuthUserId: "owner-1",
      orgSlug: "amorim",
      confirmation: "confirmado",
      supabase: mockSupabase,
    };
  });

  it("creates an expense with confirmation", async () => {
    const { createExpenseFromAi } = await import("@/lib/ai/manager/actions-handler");
    const result = await createExpenseFromAi(
      { memberId: "member-1", categoryId: "cat-1", amount: 83, date: "2026-06-25", description: "Mercado" },
      ctx as never,
    );
    expect(result.success).toBe("Gasto criado com sucesso.");
    expect(result.error).toBeUndefined();
    expect(mockSupabase.from).toHaveBeenCalledWith("expenses");
  });

  it("returns needsConfirmation when confirmation is missing", async () => {
    const { createExpenseFromAi } = await import("@/lib/ai/manager/actions-handler");
    const result = await createExpenseFromAi(
      { memberId: "member-1", categoryId: "cat-1", amount: 83, date: "2026-06-25", description: "Mercado" },
      { ...ctx, confirmation: "" } as never,
    );
    expect(result.needsConfirmation).toBe(true);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it("creates a payable bill with confirmation", async () => {
    const { createPayableBillFromAi } = await import("@/lib/ai/manager/actions-handler");
    const result = await createPayableBillFromAi(
      { memberId: "member-1", categoryId: "cat-1", name: "Internet", amount: 50, dueDate: "2026-07-15" },
      ctx as never,
    );
    expect(result.success).toBe("Conta criada com sucesso.");
  });

  it("marks payable as paid with confirmation", async () => {
    const { markPayablePaidFromAi } = await import("@/lib/ai/manager/actions-handler");
    const result = await markPayablePaidFromAi("bill-1", "bank-1", ctx as never);
    expect(result.success).toBe("Conta marcada como paga com sucesso.");
    expect(mockSupabase.rpc).toHaveBeenCalledWith("mark_payable_bill_paid_with_movement", expect.any(Object));
  });

  it("deletes an expense with confirmation", async () => {
    const { deleteExpenseFromAi } = await import("@/lib/ai/manager/actions-handler");
    const result = await deleteExpenseFromAi("expense-1", ctx as never);
    expect(result.success).toBe("Gasto excluido com sucesso.");
  });

  it("handles invalid amount", async () => {
    const { createExpenseFromAi } = await import("@/lib/ai/manager/actions-handler");
    const result = await createExpenseFromAi(
      { memberId: "member-1", categoryId: "cat-1", amount: -1, date: "2026-06-25", description: "Teste" },
      { ...ctx, confirmation: "" } as never,
    );
    expect(result.needsConfirmation).toBe(true);
  });
});
