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
    owner_auth_user_id: "org-owner-1",
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
  categoryLookup: {
    id: "category-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  insertedExpense: {
    id: "expense-new",
  } as Record<string, unknown> | null,
  expenseMovementCalls: [] as Array<Record<string, unknown>>,
  insertedRows: [] as Array<{ table: string; payload: Record<string, unknown> }>,
  updatedRows: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  mutationCount: 1 as number | null,
  mutationError: null as { message: string } | null,
  rateLimitAllowed: true,
  rateLimitChecks: [] as Array<Record<string, unknown>>,
  auditEvents: [] as Array<Record<string, unknown>>,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function validExpenseForm(overrides: Record<string, string> = {}) {
  return createFormData({
    id: "expense-1",
    family_member_id: "member-1",
    category_id: "category-1",
    expense_date: "2026-05-17",
    description: "Mercado",
    purchase_location: "Padaria",
    amount: "45.90",
    payment_method: "pix",
    bank_or_card: "Conta principal",
    bank_id: "bank-1",
    notes: "Compra semanal",
    ...overrides,
  });
}

function makeQuery(table: string) {
  const filters: Record<string, unknown> = {};
  let updatePayload: Record<string, unknown> | null = null;

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload && key === "organization_id") {
        mockState.updatedRows.push({ table, payload: updatePayload, filters: { ...filters } });
        return Promise.resolve({ error: mockState.mutationError, count: mockState.mutationCount });
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

      if (table === "expense_categories") {
        return Promise.resolve({ data: mockState.categoryLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    single() {
      return Promise.resolve({ data: mockState.insertedExpense, error: mockState.mutationError });
    },
    insert(payload: Record<string, unknown>) {
      mockState.insertedRows.push({ table, payload });
      return query;
    },
    update(payload: Record<string, unknown>, options?: Record<string, unknown>) {
      if (options?.count !== "exact") {
        throw new Error("Expected exact update count");
      }

      updatePayload = payload;
      return query;
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    rpc(name: string, payload: Record<string, unknown>) {
      if (name === "create_expense_with_movement") {
        mockState.expenseMovementCalls.push(payload);
        return Promise.resolve({ data: mockState.insertedExpense?.id ?? null, error: mockState.mutationError });
      }

      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (!["expenses", "family_members", "expense_categories"].includes(table)) {
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

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 9, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("expense write audit runtime actions", () => {
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
    mockState.categoryLookup = {
      id: "category-1",
      organization_id: "org-1",
    };
    mockState.insertedExpense = {
      id: "expense-new",
    };
    mockState.expenseMovementCalls = [];
    mockState.insertedRows = [];
    mockState.updatedRows = [];
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("records expense create audit event after a rate-limited organization-scoped insert", async () => {
    const { createExpense } = await import("@/app/protected/gastos/actions");

    const result = await createExpense({} as never, validExpenseForm());

    expect(result).toEqual({ success: "Gasto cadastrado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.expense.create",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.expenseMovementCalls).toEqual([
      {
        target_organization_id: "org-1",
        target_owner_id: "org-owner-1",
        target_family_member_id: "member-1",
        target_category_id: "category-1",
        target_expense_date: "2026-05-17",
        target_description: "Mercado",
        target_purchase_location: "Padaria",
        target_amount: 45.9,
        target_payment_method: "pix",
        target_bank_id: "bank-1",
        target_notes: "Compra semanal",
        target_profile_id: "profile-1",
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.expense.create",
        p_target_type: "expense",
        p_target_id: "expense-new",
        p_outcome: "success",
        p_metadata: {
          expense_created: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not create an expense when create rate limit blocks the action", async () => {
    const { createExpense } = await import("@/app/protected/gastos/actions");
    mockState.rateLimitAllowed = false;

    const result = await createExpense({} as never, validExpenseForm());

    expect(result).toEqual({
      error: "Muitas tentativas de cadastro de gasto. Tente novamente em alguns minutos.",
    });
    expect(mockState.expenseMovementCalls).toHaveLength(0);
    expect(mockState.insertedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.expense.create",
        p_target_type: "expense",
        p_target_id: null,
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          expense_created: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("records expense update audit event after an exact organization-scoped update", async () => {
    const { updateExpense } = await import("@/app/protected/gastos/actions");

    const result = await updateExpense({} as never, validExpenseForm({
      description: "Mercado mensal",
    }));

    expect(result).toEqual({ success: "Gasto atualizado com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.expense.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "profile-1",
        organizationId: "org-1",
        targetKey: "expense-1",
      },
    ]);
    expect(mockState.updatedRows).toEqual([
      {
        table: "expenses",
        payload: {
          family_member_id: "member-1",
          category_id: "category-1",
          expense_date: "2026-05-17",
          description: "Mercado mensal",
          purchase_location: "Padaria",
          amount: 45.9,
          payment_method: "pix",
          bank_or_card: "Conta principal",
          notes: "Compra semanal",
          organization_id: "org-1",
        },
        filters: {
          id: "expense-1",
          organization_id: "org-1",
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.expense.update",
        p_target_type: "expense",
        p_target_id: "expense-1",
        p_outcome: "success",
        p_metadata: {
          expense_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not update an expense when update rate limit blocks the action", async () => {
    const { updateExpense } = await import("@/app/protected/gastos/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateExpense({} as never, validExpenseForm({
      description: "Mercado mensal",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de gasto. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.expense.update",
        p_target_type: "expense",
        p_target_id: "expense-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          expense_changed: true,
          family_member_id: "member-1",
        },
      }),
    ]);
  });

  it("does not record expense update audit event when no row was updated", async () => {
    const { updateExpense } = await import("@/app/protected/gastos/actions");
    mockState.mutationCount = 0;

    const result = await updateExpense({} as never, validExpenseForm({
      description: "Mercado mensal",
    }));

    expect(result).toEqual({ error: "Gasto nao encontrado." });
    expect(mockState.updatedRows).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });
});
