import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryRecord = {
  table: string;
  eq: Record<string, unknown>;
};

const mockState = vi.hoisted(() => ({
  currentProfile: { id: "profile-1", owner_id: "owner-1", role: "admin" },
  currentOrganization: { id: "org-1", slug: "familia-a", owner_auth_user_id: "org-owner-1" },
  insertedPayloads: [] as Array<Record<string, unknown>>,
  updatedPayloads: [] as Array<Record<string, unknown>>,
  queryRecords: [] as QueryRecord[],
  bankLookup: null as Record<string, unknown> | null,
  memberLookup: { id: "member-1", organization_id: "org-1" } as Record<string, unknown> | null,
  accessError: null as Error | null,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

function validBankAccountForm(overrides: Record<string, string> = {}) {
  return createFormData({
    family_member_id: "member-1",
    bank_name: "Revolut",
    account_type: "corrente",
    current_balance: "1500.25",
    currency: "BRL",
    notes: "Conta familiar",
    ...overrides,
  });
}

function expectMemberLookupFilters(id: string) {
  const record = mockState.queryRecords.filter((item) => item.table === "family_members").at(-1);
  expect(record).toEqual({
    table: "family_members",
    eq: { id, organization_id: "org-1" },
  });
}

function makeQuery(table: string) {
  const record: QueryRecord = { table, eq: {} };
  const query = {
    select() { return query; },
    eq(key: string, value: unknown) { record.eq[key] = value; return query; },
    maybeSingle() {
      mockState.queryRecords.push({ table: record.table, eq: { ...record.eq } });
      return Promise.resolve({
        data: table === "family_members" ? mockState.memberLookup : mockState.bankLookup,
        error: null,
      });
    },
    insert(payload: Record<string, unknown>) {
      mockState.insertedPayloads.push(payload);
      return {
        select() {
          return {
            single() {
              return Promise.resolve({ data: { id: "bank-1" }, error: null });
            },
          };
        },
      };
    },
    update(payload: Record<string, unknown>) {
      mockState.updatedPayloads.push(payload);
      const updateQuery = {
        eq(key: string, value: unknown) {
          record.eq[key] = value;
          return updateQuery;
        },
        then(resolve: (value: { error: null; count: number }) => void) {
          mockState.queryRecords.push({ table: record.table, eq: { ...record.eq } });
          return Promise.resolve({ error: null, count: 1 }).then(resolve);
        },
      };
      return updateQuery;
    },
  };
  return query;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (!["banks", "family_members"].includes(table)) {
        throw new Error(`Unexpected table: ${table}`);
      }
      return makeQuery(table);
    },
  };
}

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit/events", () => ({ recordAuditEvent: vi.fn(async () => undefined) }));
vi.mock("@/lib/organizations/revalidation", () => ({ revalidateOrganizationPaths: vi.fn() }));
vi.mock("@/lib/security/sensitive-rate-limit", () => ({
  checkSensitiveOperationRateLimit: vi.fn(() => ({ allowed: true })),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => makeSupabaseClient()) }));
vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: vi.fn(async () => ({
    organization: mockState.currentOrganization,
    membership: { role: "owner", is_active: true },
  })),
}));
vi.mock("@/lib/finance/access-control", () => ({
  getCurrentProfile: vi.fn(async () => mockState.currentProfile),
  assertCanAccessMember: vi.fn(async () => {
    if (mockState.accessError) throw mockState.accessError;
  }),
}));

describe("bank account organization access actions", () => {
  beforeEach(() => {
    mockState.insertedPayloads = [];
    mockState.updatedPayloads = [];
    mockState.queryRecords = [];
    mockState.bankLookup = null;
    mockState.memberLookup = { id: "member-1", organization_id: "org-1" };
    mockState.accessError = null;
  });

  it("blocks creation when the linked member lookup is not returned", async () => {
    const { createBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.memberLookup = null;

    const result = await createBankAccount({}, validBankAccountForm({ family_member_id: "member-org-2" }));

    expect(result).toEqual({ error: "Pessoa vinculada nao pertence a esta organizacao." });
    expectMemberLookupFilters("member-org-2");
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("blocks a legacy linked member while keeping active organization writes explicit", async () => {
    const { createBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.memberLookup = null;

    const result = await createBankAccount({}, validBankAccountForm({ family_member_id: "legacy-member" }));

    expect(result).toEqual({ error: "Pessoa vinculada nao pertence a esta organizacao." });
    expectMemberLookupFilters("legacy-member");
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("creates bank accounts with the target organization's legacy owner id", async () => {
    const { createBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await createBankAccount({}, validBankAccountForm());

    expect(result).toEqual({ success: "Banco cadastrado com sucesso." });
    expect(mockState.insertedPayloads).toEqual([
      expect.objectContaining({
        owner_id: "org-owner-1",
        organization_id: "org-1",
        family_member_id: "member-1",
        bank_name: "Revolut",
      }),
    ]);
    expectMemberLookupFilters("member-1");
  });

  it("rejects bank names outside the controlled system options", async () => {
    const { createBankAccount } = await import("@/app/protected/bancos/actions");

    const result = await createBankAccount({}, validBankAccountForm({ bank_name: "Banco Manual" }));

    expect(result).toEqual({ error: "Selecione um banco da lista do sistema." });
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("preserves a saved legacy bank name when updating other account fields", async () => {
    const { updateBankAccount } = await import("@/app/protected/bancos/actions");
    mockState.bankLookup = {
      id: "bank-legacy",
      owner_id: "org-owner-1",
      family_member_id: "member-1",
      bank_name: "Banco Manual Antigo",
      account_type: "corrente",
      current_balance: 1500.25,
      currency: "BRL",
      notes: "Conta familiar",
    };

    const result = await updateBankAccount({}, validBankAccountForm({
      id: "bank-legacy",
      bank_name: "Banco Manual Antigo",
      notes: "Conta atualizada",
    }));

    expect(result).toEqual({ success: "Banco atualizado com sucesso." });
    expect(mockState.updatedPayloads).toEqual([
      expect.objectContaining({
        bank_name: "Banco Manual Antigo",
        notes: "Conta atualizada",
      }),
    ]);
  });
});
