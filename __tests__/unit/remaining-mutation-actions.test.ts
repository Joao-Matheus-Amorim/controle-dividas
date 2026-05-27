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
  claims: {
    sub: "owner-1",
    email: "admin@example.com",
  },
  updatedPayloads: [] as Array<{ table: string; payload: Record<string, unknown>; filters: Record<string, unknown> }>,
  deletedRows: [] as Array<{ table: string; filters: Record<string, unknown> }>,
  bankLookup: {
    id: "bank-1",
    owner_id: "owner-1",
    family_member_id: "member-1",
  } as Record<string, unknown> | null,
  memberLookup: {
    id: "member-1",
    organization_id: "org-1",
  } as Record<string, unknown> | null,
  updateErrors: {} as Record<string, { message: string } | null>,
  deleteErrors: {} as Record<string, { message: string } | null>,
  accessError: null as Error | null,
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

  const finishMutation = () => {
    if (updatePayload) {
      mockState.updatedPayloads.push({ table, payload: updatePayload, filters: { ...filters } });
      return Promise.resolve({ error: mockState.updateErrors[table] ?? null });
    }

    if (deleteMode) {
      mockState.deletedRows.push({ table, filters: { ...filters } });
      return Promise.resolve({ error: mockState.deleteErrors[table] ?? null });
    }

    return query;
  };

  const query = {
    select() {
      return query;
    },
    eq(key: string, value: unknown) {
      filters[key] = value;

      if (updatePayload && key === "organization_id") {
        return finishMutation();
      }

      return query;
    },
    or(expression: string) {
      filters.or = expression;
      return finishMutation();
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
    auth: {
      getClaims: vi.fn(async () => ({
        data: { claims: mockState.claims },
        error: null,
      })),
    },
    from(table: string) {
      if (!["banks", "family_members", "expense_categories"].includes(table)) {
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
  assertCanAccessMember: vi.fn(async () => {
    if (mockState.accessError) {
      throw mockState.accessError;
    }
  }),
}));

describe("remaining finance mutation actions", () => {
  beforeEach(() => {
    mockState.updatedPayloads = [];
    mockState.deletedRows = [];
    mockState.updateErrors = {};
    mockState.deleteErrors = {};
    mockState.accessError = null;
    mockState.bankLookup = {
      id: "bank-1",
      owner_id: "owner-1",
      family_member_id: "member-1",
    };
    mockState.memberLookup = {
      id: "member-1",
      organization_id: "org-1",
    };
  });

  it("returns bank balance Supabase update errors instead of swallowing them", async () => {
    const { updateBankAccountBalance } = await import("@/app/protected/bancos/actions");
    mockState.updateErrors.banks = { message: "bank balance update failed" };

    const result = await updateBankAccountBalance(createFormData({
      id: "bank-1",
      current_balance: "123.45",
    }));

    expect(result).toEqual({ error: "bank balance update failed" });
    expect(mockState.updatedPayloads.at(-1)).toEqual(expect.objectContaining({
      table: "banks",
      payload: expect.objectContaining({ current_balance: 123.45, organization_id: "org-1" }),
      filters: expect.objectContaining({ id: "bank-1", owner_id: "owner-1" }),
    }));
  });

  it("returns family member Supabase update errors instead of swallowing them", async () => {
    const { updateFamilyMember } = await import("@/app/protected/pessoas/actions");
    mockState.updateErrors.family_members = { message: "member update failed" };

    const result = await updateFamilyMember(createFormData({
      id: "member-1",
      name: "Maria",
      role: "Mae",
      monthly_limit: "500",
    }));

    expect(result).toEqual({ error: "member update failed" });
    expect(mockState.updatedPayloads.at(-1)).toEqual(expect.objectContaining({
      table: "family_members",
      payload: expect.objectContaining({ name: "Maria", role: "Mae", monthly_limit: 500, organization_id: "org-1" }),
      filters: expect.objectContaining({ id: "member-1", owner_id: "owner-1" }),
    }));
  });

  it("returns settings member limit Supabase update errors instead of swallowing them", async () => {
    const { updateFamilyMemberLimit } = await import("@/app/protected/configuracoes/actions");
    mockState.updateErrors.family_members = { message: "limit update failed" };

    const result = await updateFamilyMemberLimit(createFormData({
      id: "member-1",
      monthly_limit: "750",
    }));

    expect(result).toEqual({ error: "limit update failed" });
    expect(mockState.updatedPayloads.at(-1)).toEqual(expect.objectContaining({
      table: "family_members",
      payload: expect.objectContaining({ monthly_limit: 750, organization_id: "org-1" }),
      filters: expect.objectContaining({ id: "member-1", owner_id: "owner-1" }),
    }));
  });

  it("returns settings category delete Supabase errors instead of swallowing them", async () => {
    const { deleteExpenseCategory } = await import("@/app/protected/configuracoes/actions");
    mockState.deleteErrors.expense_categories = { message: "category delete failed" };

    const result = await deleteExpenseCategory(createFormData({
      id: "category-1",
    }));

    expect(result).toEqual({ error: "category delete failed" });
    expect(mockState.deletedRows.at(-1)).toEqual(expect.objectContaining({
      table: "expense_categories",
      filters: expect.objectContaining({ id: "category-1", owner_id: "owner-1", is_default: false }),
    }));
  });
});
