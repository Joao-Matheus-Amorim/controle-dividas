import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryRecord = {
  table: string;
  eq: Record<string, unknown>;
  in: Record<string, unknown[]>;
  or?: string;
};

const mockState = vi.hoisted(() => ({
  currentProfile: { id: "profile-1", owner_id: "owner-1", role: "admin" },
  currentOrganization: { id: "org-1", slug: "familia-a" },
  queryRecords: [] as QueryRecord[],
  accessibleMemberIds: ["inactive-member"],
  members: [
    {
      id: "inactive-member",
      owner_id: "owner-1",
      organization_id: "org-1",
      name: "Membro historico",
      role: "adult",
      monthly_limit: 0,
      currency: "BRL",
      is_active: false,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  accounts: [
    {
      id: "bank-1",
      owner_id: "owner-1",
      organization_id: "org-1",
      family_member_id: "inactive-member",
      bank_name: "Banco Historico",
      account_type: "corrente",
      current_balance: 350,
      currency: "BRL",
      notes: null,
      created_at: "2026-01-02T00:00:00.000Z",
      family_members: { id: "inactive-member", name: "Membro historico" },
    },
  ],
}));

function makeQuery(table: string) {
  const record: QueryRecord = { table, eq: {}, in: {} };

  const query = {
    select() { return query; },
    eq(key: string, value: unknown) { record.eq[key] = value; return query; },
    or(expression: string) { record.or = expression; return query; },
    in(key: string, value: unknown[]) { record.in[key] = value; return query; },
    order() { return query; },
    then(resolve: (value: { data: unknown[]; error: null }) => void) {
      mockState.queryRecords.push({
        table: record.table,
        eq: { ...record.eq },
        in: { ...record.in },
        or: record.or,
      });

      const data = table === "family_members" ? mockState.members : mockState.accounts;
      return Promise.resolve(resolve({ data, error: null }));
    },
  };

  return query;
}

function makeSupabaseClient() {
  return {
    from(table: string) {
      if (!["family_members", "banks"].includes(table)) {
        throw new Error(`Unexpected table: ${table}`);
      }
      return makeQuery(table);
    },
  };
}

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => makeSupabaseClient()) }));
vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: vi.fn(async () => ({
    organization: mockState.currentOrganization,
    membership: { role: "owner", is_active: true },
  })),
}));
vi.mock("@/lib/finance/access-control", () => ({
  getCurrentProfile: vi.fn(async () => mockState.currentProfile),
  getAccessibleMemberIds: vi.fn(async () => mockState.accessibleMemberIds),
}));

describe("organization bank listing", () => {
  beforeEach(() => {
    mockState.queryRecords = [];
    mockState.accessibleMemberIds = ["inactive-member"];
  });

  it("keeps historical bank accounts visible for inactive members", async () => {
    const { getOrganizationBanksDashboardData } = await import("@/lib/organizations/banks");

    const result = await getOrganizationBanksDashboardData();

    expect(result.members).toEqual(mockState.members);
    expect(result.accounts).toEqual(mockState.accounts);
    expect(result.accountsByMember).toEqual([
      expect.objectContaining({
        id: "inactive-member",
        is_active: false,
        accounts: mockState.accounts,
        totalBalance: 350,
      }),
    ]);
    expect(result.totalBalance).toBe(350);
    expect(result.totalAccounts).toBe(1);
  });

  it("keeps bank helper member reads scoped to active organization without active status filtering", async () => {
    const { getOrganizationBanksDashboardData } = await import("@/lib/organizations/banks");

    await getOrganizationBanksDashboardData();

    const memberQueries = mockState.queryRecords.filter((record) => record.table === "family_members");

    expect(memberQueries).not.toHaveLength(0);
    expect(memberQueries.at(-1)).toEqual({
      table: "family_members",
      eq: { owner_id: "owner-1", organization_id: "org-1" },
      in: { id: ["inactive-member"] },
      or: undefined,
    });
    expect(memberQueries.at(-1)?.eq).not.toHaveProperty("is_active");
  });

  it("keeps bank account reads scoped to active organization without legacy fallback", async () => {
    const { getOrganizationBanksDashboardData } = await import("@/lib/organizations/banks");

    await getOrganizationBanksDashboardData();

    const bankQueries = mockState.queryRecords.filter((record) => record.table === "banks");

    expect(bankQueries).not.toHaveLength(0);
    expect(bankQueries.at(-1)).toEqual({
      table: "banks",
      eq: { owner_id: "owner-1", organization_id: "org-1" },
      in: { family_member_id: ["inactive-member"] },
      or: undefined,
    });
  });
});
