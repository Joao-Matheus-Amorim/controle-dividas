import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  currentOrganization: {
    id: "org-1",
    slug: "amorim",
  },
  claims: {
    sub: "owner-1",
    email: "admin@example.com",
  },
  currentProfile: {
    id: "profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  categoryLookup: {
    id: "category-1",
    name: "Mercado",
    description: "Compras",
    is_default: false,
  } as Record<string, unknown> | null,
  insertedCategory: {
    id: "category-new",
  } as Record<string, unknown> | null,
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
      return Promise.resolve({ data: mockState.categoryLookup, error: null });
    },
    single() {
      return Promise.resolve({ data: mockState.insertedCategory, error: mockState.mutationError });
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
    auth: {
      getClaims: vi.fn(async () => ({
        data: { claims: mockState.claims },
        error: null,
      })),
    },
    rpc(name: string, payload: Record<string, unknown>) {
      if (name !== "record_audit_event") {
        throw new Error(`Unexpected rpc: ${name}`);
      }

      mockState.auditEvents.push(payload);
      return Promise.resolve({ error: null });
    },
    from(table: string) {
      if (table !== "expense_categories") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return makeQuery(table);
    },
  };
}

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
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
}));

vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn((input: Record<string, unknown>) => {
    mockState.rateLimitChecks.push(input);

    return mockState.rateLimitAllowed
      ? { allowed: true, remaining: 9, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("expense category write audit runtime actions", () => {
  beforeEach(() => {
    mockState.categoryLookup = {
      id: "category-1",
      name: "Mercado",
      description: "Compras",
      is_default: false,
    };
    mockState.insertedCategory = {
      id: "category-new",
    };
    mockState.insertedRows = [];
    mockState.updatedRows = [];
    mockState.mutationCount = 1;
    mockState.mutationError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("records category create audit event after a rate-limited organization-scoped insert", async () => {
    const { createExpenseCategory } = await import("@/app/protected/configuracoes/actions");

    const result = await createExpenseCategory({} as never, createFormData({
      name: "Mercado",
      description: "Compras",
    }));

    expect(result).toEqual({ success: "Categoria cadastrada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.category.create",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "owner-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.insertedRows).toEqual([
      {
        table: "expense_categories",
        payload: {
          owner_id: "owner-1",
          organization_id: "org-1",
          name: "Mercado",
          description: "Compras",
          is_default: false,
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.category.create",
        p_target_type: "expense_category",
        p_target_id: "category-new",
        p_outcome: "success",
        p_metadata: {
          category_created: true,
        },
      }),
    ]);
  });

  it("does not create a category when create rate limit blocks the action", async () => {
    const { createExpenseCategory } = await import("@/app/protected/configuracoes/actions");
    mockState.rateLimitAllowed = false;

    const result = await createExpenseCategory({} as never, createFormData({
      name: "Mercado",
      description: "Compras",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de cadastro de categoria. Tente novamente em alguns minutos.",
    });
    expect(mockState.insertedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.category.create",
        p_target_type: "expense_category",
        p_target_id: null,
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          category_created: true,
        },
      }),
    ]);
  });

  it("records category update audit event after an exact organization-scoped update", async () => {
    const { updateExpenseCategory } = await import("@/app/protected/configuracoes/actions");

    const result = await updateExpenseCategory({} as never, createFormData({
      id: "category-1",
      name: "Mercado mensal",
      description: "Compras da casa",
    }));

    expect(result).toEqual({ success: "Categoria atualizada com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.category.update",
        limit: 10,
        windowMs: 10 * 60 * 1000,
        actorKey: "owner-1",
        organizationId: "org-1",
        targetKey: "category-1",
      },
    ]);
    expect(mockState.updatedRows).toEqual([
      {
        table: "expense_categories",
        payload: {
          name: "Mercado mensal",
          description: "Compras da casa",
          organization_id: "org-1",
        },
        filters: {
          id: "category-1",
          owner_id: "owner-1",
          organization_id: "org-1",
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.category.update",
        p_target_type: "expense_category",
        p_target_id: "category-1",
        p_outcome: "success",
        p_metadata: {
          category_changed: true,
        },
      }),
    ]);
  });

  it("skips rate limiting and audit when category values are unchanged", async () => {
    const { updateExpenseCategory } = await import("@/app/protected/configuracoes/actions");

    const result = await updateExpenseCategory({} as never, createFormData({
      id: "category-1",
      name: "Mercado",
      description: "Compras",
    }));

    expect(result).toEqual({ success: "Categoria atualizada com sucesso." });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.rateLimitChecks).toHaveLength(0);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not update a category when update rate limit blocks the action", async () => {
    const { updateExpenseCategory } = await import("@/app/protected/configuracoes/actions");
    mockState.rateLimitAllowed = false;

    const result = await updateExpenseCategory({} as never, createFormData({
      id: "category-1",
      name: "Mercado mensal",
      description: "Compras da casa",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de alteracao de categoria. Tente novamente em alguns minutos.",
    });
    expect(mockState.updatedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.category.update",
        p_target_type: "expense_category",
        p_target_id: "category-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
          category_changed: true,
        },
      }),
    ]);
  });
});
