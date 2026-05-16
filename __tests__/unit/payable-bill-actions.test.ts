import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  currentProfile: {
    id: "profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  insertedPayloads: [] as Array<Record<string, unknown>>,
  updatedPayloads: [] as Array<Record<string, unknown>>,
  deletedIds: [] as string[],
  billLookup: {
    id: "bill-1",
    owner_id: "owner-1",
    responsible_member_id: "member-1",
  } as Record<string, unknown> | null,
  insertError: null as { message: string } | null,
  accessError: null as Error | null,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (table !== "payable_bills") {
        throw new Error(`Unexpected table: ${table}`);
      }

      const filters: Record<string, unknown> = {};
      let updatePayload: Record<string, unknown> | null = null;

      const query = {
        select() {
          return query;
        },
        eq(key: string, value: unknown) {
          filters[key] = value;

          if (updatePayload) {
            mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
          }

          return query;
        },
        maybeSingle() {
          return Promise.resolve({ data: mockState.billLookup, error: null });
        },
        insert(payload: Record<string, unknown>) {
          mockState.insertedPayloads.push(payload);
          return Promise.resolve({ error: mockState.insertError });
        },
        update(payload: Record<string, unknown>) {
          updatePayload = payload;
          return query;
        },
        delete() {
          return {
            eq(key: string, value: unknown) {
              if (key === "id") {
                mockState.deletedIds.push(String(value));
              }
              filters[key] = value;
              return this;
            },
          };
        },
      };

      return query;
    },
  };
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeSupabaseClient()),
}));

vi.mock("@/lib/finance/access-control", () => ({
  getCurrentProfile: vi.fn(async () => mockState.currentProfile),
  assertCanAccessMember: vi.fn(async () => {
    if (mockState.accessError) {
      throw mockState.accessError;
    }
  }),
}));

describe("payable bill actions", () => {
  beforeEach(() => {
    mockState.insertedPayloads = [];
    mockState.updatedPayloads = [];
    mockState.deletedIds = [];
    mockState.billLookup = {
      id: "bill-1",
      owner_id: "owner-1",
      responsible_member_id: "member-1",
    };
    mockState.insertError = null;
    mockState.accessError = null;
  });

  it("blocks payable bill creation without responsible member", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Internet",
      amount: "120",
      due_date: "2026-05-20",
    }));

    expect(result).toEqual({ error: "Selecione o responsavel pela conta." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("blocks payable bill creation with invalid amount", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Internet",
      amount: "0",
      due_date: "2026-05-20",
      responsible_member_id: "member-1",
    }));

    expect(result).toEqual({ error: "Informe um valor valido." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("creates one-off payable bill as avulsa without recurrence", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Boleto eventual",
      category: "Outros",
      amount: "90.50",
      due_date: "2026-05-20",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "avulsa",
      recurrence: "mensal",
    }));

    expect(result).toEqual({ success: "Conta avulsa cadastrada com sucesso." });
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        owner_id: "owner-1",
        name: "Boleto eventual",
        amount: 90.5,
        status: "pendente",
        bill_type: "avulsa",
        recurrence: null,
      }),
    ]);
  });

  it("creates fixed payable bill as fixa with monthly recurrence by default", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");

    const result = await createPayableBill({}, createFormData({
      name: "Aluguel",
      category: "Aluguel",
      amount: "850",
      due_date: "2026-05-05",
      responsible_member_id: "member-1",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({ success: "Conta fixa cadastrada com sucesso." });
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        name: "Aluguel",
        amount: 850,
        bill_type: "fixa",
        recurrence: "mensal",
      }),
    ]);
  });

  it("returns permission error when the user cannot create for the selected member", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.accessError = new Error("Voce nao tem permissao para cadastrar conta para esta pessoa.");

    const result = await createPayableBill({}, createFormData({
      name: "Escola",
      amount: "300",
      due_date: "2026-05-10",
      responsible_member_id: "member-2",
      status: "pendente",
      bill_type: "fixa",
    }));

    expect(result).toEqual({ error: "Voce nao tem permissao para cadastrar conta para esta pessoa." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });
});
