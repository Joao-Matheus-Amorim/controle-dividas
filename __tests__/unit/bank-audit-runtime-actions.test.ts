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
  bankLookup: {
    id: "bank-1",
    owner_id: "owner-1",
    family_member_id: "member-1",
    current_balance: 100,
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  updatedRows: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  deletedRows: [] as Array<{ table: string; filters: Record<string, unknown> }>,
  mutationCount: 1 as number | null,
  mutationError: null as { message: string } | null,
  auditEvents: [] as Array<Record<string, unknown>>,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
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

      if ((updatePayload || deleteMode) && key === "organization_id") {
        if (updatePayload) {
          mockState.updatedRows.push({ table, payload: updatePayload, filters: { ...filters } });
        }

        if (deleteMode) {
          mockState.deletedRows.push({ table, filters: { ...filters } });
        }

        return Promise.resolve({ error: mockState.mutationError, count: mockState.mutationCount });
      }

      return query;
    },
    maybeSingle() {
      if (table === "banks") {
        return Promise.resolve({ data: mockState.bankLookup, error: null });
      }

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    update(payload: Record<string, unknown>, options?: Record<string, unknown>) {
      if (options?.count !== "exact") {
        throw new Error("Expected exact update count");
      }

      updatePayload = payload;
      return query;
    },
    delete(options?: Record<string, unknown>) {
      if (options?.count !== "exact") {
        throw new Error("Expected exact delete count");
      }

      deleteMode = true;
      return query;
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    rpc(name: string, payload: Record<string, unknown>) {
      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (!["banks", "family_members"].includes(table)) {
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
  assertCanAccessMember: vi.fn(async () => true),
}));

describe("bank audit runtime actions", () => {
  beforeEach(() => {
    mockState.bankLookup = {
      id: "bank-1",
      owner_id: "owner-1",
      family_member_id: "member-1",
      current_balance: 100,
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.updatedRows = [];
    mockState.deletedRows = [];
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.auditEvents = [];
  });

  it("records bank balance audit event from the quick balance action", async () => {
    const { updateBankAccountBalance } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccountBalance(createFormData({
      id: "bank-1",
      current_balance: "125.50",
    }));

    expect(result).toEqual({ success: "Saldo atualizado com sucesso." });
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "success",
        p_metadata: {
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("records bank balance audit event from the full edit form", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await updateBankAccount({}, createFormData({
      id: "bank-1",
      family_member_id: "member-1",
      bank_name: "Wise",
      current_balance: "180",
      currency: "EUR",
    }));

    expect(result).toEqual({ success: "Banco atualizado com sucesso." });
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_action: "finance.bank.balance.update",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_metadata: {
          balance_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("records bank delete audit event only after an exact row delete", async () => {
    const { deleteBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await deleteBankAccount(createFormData({
      id: "bank-1",
    }));

    expect(result).toEqual({ success: "Banco excluido com sucesso." });
    expect(mockState.deletedRows).toHaveLength(1);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.bank.delete",
        p_target_type: "bank",
        p_target_id: "bank-1",
        p_outcome: "success",
        p_metadata: {
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not record bank delete audit event when no row was deleted", async () => {
    const { deleteBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.mutationCount = 0;

    const result = await deleteBankAccount(createFormData({
      id: "bank-1",
    }));

    expect(result).toEqual({ error: "Banco nao encontrado." });
    expect(mockState.deletedRows).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });
});
