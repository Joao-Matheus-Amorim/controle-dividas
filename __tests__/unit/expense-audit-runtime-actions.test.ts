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
  expenseLookup: {
    id: "expense-1",
    owner_id: "owner-1",
    family_member_id: "member-1",
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  deletedRows: [] as Array<{ table: string; filters: Record<string, unknown> }>,
  deleteError: null as { message: string } | null,
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
  let deleteMode = false;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (deleteMode && key === "organization_id") {
        mockState.deletedRows.push({ table, filters: { ...filters } });
        return Promise.resolve({ error: mockState.deleteError });
      }

      return query;
    },
    maybeSingle() {
      if (table === "expenses") {
        return Promise.resolve({ data: mockState.expenseLookup, error: null });
      }

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
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
    rpc(name: string, payload: Record<string, unknown>) {
      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (!["expenses", "family_members"].includes(table)) {
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

describe("expense audit runtime actions", () => {
  beforeEach(() => {
    mockState.expenseLookup = {
      id: "expense-1",
      owner_id: "owner-1",
      family_member_id: "member-1",
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.deletedRows = [];
    mockState.deleteError = null;
    mockState.auditEvents = [];
  });

  it("records expense delete audit event after deleting the organization-scoped expense", async () => {
    const { deleteExpense } = await import("@/app/protected/gastos/actions");

    const result = await deleteExpense(createFormData({
      id: "expense-1",
      confirm_delete: "confirmado",
    }));

    expect(result).toEqual({ success: "Gasto excluido com sucesso." });
    expect(mockState.deletedRows).toEqual([
      {
        table: "expenses",
        filters: {
          id: "expense-1",
          owner_id: "owner-1",
          organization_id: "org-1",
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.expense.delete",
        p_target_type: "expense",
        p_target_id: "expense-1",
        p_outcome: "success",
        p_metadata: {
          family_member_id: "member-1",
        },
      }),
    ]);
  });
});
