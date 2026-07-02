import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryRecord = {
  table: string;
  eq: Record<string, unknown>;
};

const mockState = vi.hoisted(() => ({
  currentProfile: { id: "profile-1", owner_id: "owner-1", role: "admin" },
  currentOrganization: { id: "org-1", slug: "familia-a", owner_auth_user_id: "org-owner-1" },
  insertedPayloads: [] as Array<Record<string, unknown>>,
  queryRecords: [] as QueryRecord[],
  memberLookup: { id: "member-1", organization_id: "org-1" } as Record<string, unknown> | null,
  accessError: null as Error | null,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

function validPayableBillForm(overrides: Record<string, string> = {}) {
  return createFormData({
    name: "Internet",
    category: "Casa",
    amount: "120.50",
    currency: "BRL",
    due_date: "2026-05-20",
    responsible_member_id: "member-1",
    status: "pendente",
    bill_type: "avulsa",
    bank_used: "Conta principal",
    recurrence: "mensal",
    notes: "Conta mensal",
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
      return Promise.resolve({ data: table === "family_members" ? mockState.memberLookup : null, error: null });
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
      if (!["payable_bills", "family_members"].includes(table)) {
        throw new Error(`Unexpected table: ${table}`);
      }
      return makeQuery(table);
    },
  };
}

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
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

describe("payable bill organization access actions", () => {
  beforeEach(() => {
    mockState.insertedPayloads = [];
    mockState.queryRecords = [];
    mockState.memberLookup = { id: "member-1", organization_id: "org-1" };
    mockState.accessError = null;
  });

  it("blocks creation when the responsible member lookup is not returned", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.memberLookup = null;

    const result = await createPayableBill({}, validPayableBillForm({ responsible_member_id: "member-org-2" }));

    expect(result).toEqual({ error: "Responsavel nao pertence a esta organizacao." });
    expectMemberLookupFilters("member-org-2");
    expect(mockState.insertedPayloads).toHaveLength(0);
  });

  it("blocks a legacy responsible member while keeping active organization writes explicit", async () => {
    const { createPayableBill } = await import("@/app/protected/contas-a-pagar/actions");
    mockState.memberLookup = null;

    const result = await createPayableBill({}, validPayableBillForm({ responsible_member_id: "legacy-member" }));

    expect(result).toEqual({ error: "Responsavel nao pertence a esta organizacao." });
    expectMemberLookupFilters("legacy-member");
    expect(mockState.insertedPayloads).toHaveLength(0);
  });
});
