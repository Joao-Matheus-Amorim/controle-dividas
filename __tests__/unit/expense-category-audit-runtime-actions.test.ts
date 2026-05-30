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
  deletedRows: [] as Array<{ table: string; filters: Record<string, unknown> }>,
  deleteCount: 1 as number | null,
  deleteError: null as { message: string } | null,
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
  let deleteMode = false;

  const query = {
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (deleteMode && key === "organization_id") {
        mockState.deletedRows.push({ table, filters: { ...filters } });
        return Promise.resolve({ error: mockState.deleteError, count: mockState.deleteCount });
      }

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
      ? { allowed: true, remaining: 4, resetAt: 1000 }
      : { allowed: false, retryAfterMs: 1000, resetAt: 1000 };
  }),
}));

describe("expense category audit runtime actions", () => {
  beforeEach(() => {
    mockState.deletedRows = [];
    mockState.deleteCount = 1;
    mockState.deleteError = null;
    mockState.rateLimitAllowed = true;
    mockState.rateLimitChecks = [];
    mockState.auditEvents = [];
  });

  it("records category delete audit event after deleting the organization-scoped category", async () => {
    const { deleteExpenseCategory } = await import("@/app/protected/configuracoes/actions");

    const result = await deleteExpenseCategory(createFormData({
      id: "category-1",
    }));

    expect(result).toEqual({ success: "Categoria excluida com sucesso." });
    expect(mockState.rateLimitChecks).toEqual([
      {
        operationKey: "finance.category.delete",
        limit: 5,
        windowMs: 10 * 60 * 1000,
        actorKey: "owner-1",
        organizationId: "org-1",
      },
    ]);
    expect(mockState.deletedRows).toEqual([
      {
        table: "expense_categories",
        filters: {
          id: "category-1",
          owner_id: "owner-1",
          is_default: false,
          organization_id: "org-1",
        },
      },
    ]);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.category.delete",
        p_target_type: "expense_category",
        p_target_id: "category-1",
        p_outcome: "success",
        p_metadata: {},
      }),
    ]);
  });

  it("does not record category delete audit event when no row was deleted", async () => {
    const { deleteExpenseCategory } = await import("@/app/protected/configuracoes/actions");
    mockState.deleteCount = 0;

    const result = await deleteExpenseCategory(createFormData({
      id: "category-1",
    }));

    expect(result).toEqual({ error: "Categoria nao encontrada." });
    expect(mockState.deletedRows).toHaveLength(1);
    expect(mockState.auditEvents).toHaveLength(0);
  });

  it("does not delete category when the delete rate limit blocks the action", async () => {
    const { deleteExpenseCategory } = await import("@/app/protected/configuracoes/actions");
    mockState.rateLimitAllowed = false;

    const result = await deleteExpenseCategory(createFormData({
      id: "category-1",
    }));

    expect(result).toEqual({
      error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos.",
    });
    expect(mockState.deletedRows).toHaveLength(0);
    expect(mockState.auditEvents).toEqual([
      expect.objectContaining({
        p_organization_id: "org-1",
        p_action: "finance.category.delete",
        p_target_type: "expense_category",
        p_target_id: "category-1",
        p_outcome: "denied",
        p_metadata: {
          status: "rate_limited",
        },
      }),
    ]);
  });
});
