import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  currentProfile: {
    id: "profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
  },
  updatedPayloads: [] as Array<Record<string, unknown>>,
  deletedIds: [] as string[],
  incomeLookup: {
    id: "income-1",
    owner_id: "owner-1",
    receiver_member_id: "member-1",
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  updateError: null as { message: string } | null,
  deleteError: null as { message: string } | null,
  accessError: null as Error | null,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function lastUpdatePayload() {
  return mockState.updatedPayloads.at(-1);
}

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};
  let updatePayload: Record<string, unknown> | null = null;
  let deleteMode = false;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload && key === "organization_id") {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.updateError });
      }

      if (deleteMode && key === "organization_id") {
        return Promise.resolve({ error: mockState.deleteError });
      }

      if (deleteMode && key === "id") {
        mockState.deletedIds.push(String(value));
      }

      return query;
    },
    or(expression: string) {
      filters.or = expression;

      if (updatePayload) {
        mockState.updatedPayloads.push({ ...updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.updateError });
      }

      if (deleteMode) {
        return Promise.resolve({ error: mockState.deleteError });
      }

      return query;
    },
    maybeSingle() {
      if (table === "receivable_incomes") {
        return Promise.resolve({ data: mockState.incomeLookup, error: null });
      }

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    update(payload: Record<string, unknown>) {
      updatePayload = payload;
      return query;
    },
    delete() {
      deleteMode = true;
      return query;
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (!["receivable_incomes", "family_members"].includes(table)) {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeQuery(table);
    },
  };
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeSupabaseClient()),
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: vi.fn(async () => ({
    organization: mockState.currentOrganization,
    membership: {
      role: "owner",
      is_active: true,
    },
  })),
}));

vi.mock("@/lib/finance/access-control", () => ({
  getCurrentProfile: vi.fn(async () => mockState.currentProfile),
  assertCanAccessMember: vi.fn(async () => {
    if (mockState.accessError) {
      throw mockState.accessError;
    }
  }),
}));

describe("receivable income actions", () => {
  beforeEach(() => {
    mockState.updatedPayloads = [];
    mockState.deletedIds = [];
    mockState.incomeLookup = {
      id: "income-1",
      owner_id: "owner-1",
      receiver_member_id: "member-1",
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.updateError = null;
    mockState.deleteError = null;
    mockState.accessError = null;
  });

  it("blocks status update with invalid status", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "cancelado",
    }));

    expect(result).toEqual({ error: "Status invalido." });
    expect(mockState.updatedPayloads).toHaveLength(0);
  });

  it("returns Supabase status update errors instead of swallowing them", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");
    mockState.updateError = { message: "database status update failed" };

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "recebido",
    }));

    expect(result).toEqual({ error: "database status update failed" });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "recebido",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "income-1", owner_id: "owner-1" }),
    }));
  });

  it("updates receivable income status successfully", async () => {
    const { updateReceivableIncomeStatus } = await import("@/app/protected/contas-a-receber/actions");

    const result = await updateReceivableIncomeStatus(createFormData({
      id: "income-1",
      status: "recebido",
    }));

    expect(result).toEqual({ success: "Status atualizado com sucesso." });
    expect(lastUpdatePayload()).toEqual(expect.objectContaining({
      status: "recebido",
      organization_id: "org-1",
      filters: expect.objectContaining({ id: "income-1", owner_id: "owner-1" }),
    }));
  });

  it("returns permission errors for delete instead of swallowing them", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.accessError = new Error("Voce nao tem permissao para executar esta acao para esta pessoa.");

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ error: "Voce nao tem permissao para executar esta acao para esta pessoa." });
    expect(mockState.deletedIds).toHaveLength(0);
  });

  it("returns Supabase delete errors instead of swallowing them", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");
    mockState.deleteError = { message: "database delete failed" };

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ error: "database delete failed" });
    expect(mockState.deletedIds).toEqual(["income-1"]);
  });

  it("deletes receivable income successfully", async () => {
    const { deleteReceivableIncome } = await import("@/app/protected/contas-a-receber/actions");

    const result = await deleteReceivableIncome(createFormData({
      id: "income-1",
    }));

    expect(result).toEqual({ success: "Recebimento excluido com sucesso." });
    expect(mockState.deletedIds).toEqual(["income-1"]);
  });
});
