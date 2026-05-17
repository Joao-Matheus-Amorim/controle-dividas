import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryRecord = {
  table: string;
  eq: Record<string, unknown>;
  or?: string;
};

const mockState = vi.hoisted(() => ({
  currentProfile: {
    id: "profile-1",
    owner_id: "owner-1",
    role: "admin",
  },
  currentOrganization: {
    id: "org-1",
    slug: "familia-a",
  },
  insertedPayloads: [] as Array<Record<string, unknown>>,
  queryRecords: [] as QueryRecord[],
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  categoryLookup: {
    id: "category-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  accessError: null as Error | null,
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
    family_member_id: "member-1",
    category_id: "category-1",
    expense_date: "2026-05-17",
    description: "Mercado",
    purchase_location: "Padaria",
    amount: "45.90",
    payment_method: "pix",
    bank_or_card: "Conta principal",
    notes: "Compra semanal",
    ...overrides,
  });
}

function getLastQueryRecord(table: string) {
  return mockState.queryRecords.filter((record) => record.table === table).at(-1);
}

function expectOrganizationLookupFilters(
  table: "family_members" | "expense_categories",
  id: string,
) {
  expect(getLastQueryRecord(table)).toEqual({
    table,
    eq: {
      id,
      owner_id: "owner-1",
    },
    or: "organization_id.eq.org-1,organization_id.is.null",
  });
}

function makeQuery(table: string) {
  const record: QueryRecord = {
    table,
    eq: {},
  };

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      record.eq[key] = value;
      return query;
    },
    or(expression: string) {
      record.or = expression;
      return query;
    },
    maybeSingle() {
      mockState.queryRecords.push({
        table: record.table,
        eq: { ...record.eq },
        or: record.or,
      });

      if (table === "family_members") {
        return Promise.resolve({ data: mockState.memberLookup, error: null });
      }

      if (table === "expense_categories") {
        return Promise.resolve({ data: mockState.categoryLookup, error: null });
      }

      return Promise.resolve({ data: null, error: null });
    },
    insert(payload: Record<string, unknown>) {
      mockState.insertedPayloads.push(payload);
      return Promise.resolve({ error: null });
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
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
  assertCanAccessMember: vi.fn(async () => {
    if (mockState.accessError) {
      throw mockState.accessError;
    }
  }),
}));

describe("expense organization access actions", () => {
  beforeEach(() => {
    mockState.insertedPayloads = [];
    mockState.queryRecords = [];
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
    mockState.categoryLookup = {
      id: "category-1",
      organization_id: "org-1",
    };
    mockState.accessError = null;
  });

  it("blocks expense creation when the selected member is outside the active organization", async () => {
    const { createExpense } = await import("@/app/protected/gastos/actions");
    mockState.memberLookup = null;

    const result = await createExpense({}, validExpenseForm({ family_member_id: "member-org-2" }));

    expect(result).toEqual({ error: "Pessoa responsavel nao pertence a esta organizacao." });
    expectOrganizationLookupFilters("family_members", "member-org-2");
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("blocks expense creation when the selected category is outside the active organization", async () => {
    const { createExpense } = await import("@/app/protected/gastos/actions");
    mockState.categoryLookup = null;

    const result = await createExpense({}, validExpenseForm({ category_id: "category-org-2" }));

    expect(result).toEqual({ error: "Categoria nao pertence a esta organizacao." });
    expectOrganizationLookupFilters("family_members", "member-1");
    expectOrganizationLookupFilters("expense_categories", "category-org-2");
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("keeps legacy member and category compatible while writing the active organization id", async () => {
    const { createExpense } = await import("@/app/protected/gastos/actions");
    mockState.memberLookup = {
      id: "legacy-member",
      organization_id: null,
    };
    mockState.categoryLookup = {
      id: "legacy-category",
      organization_id: null,
    };

    const result = await createExpense({}, validExpenseForm({
      family_member_id: "legacy-member",
      category_id: "legacy-category",
    }));

    expect(result).toEqual({ success: "Gasto cadastrado com sucesso." });
    expectOrganizationLookupFilters("family_members", "legacy-member");
    expectOrganizationLookupFilters("expense_categories", "legacy-category");
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        owner_id: "owner-1",
        organization_id: "org-1",
        family_member_id: "legacy-member",
        category_id: "legacy-category",
        amount: 45.9,
      }),
    ]);
  });
});
