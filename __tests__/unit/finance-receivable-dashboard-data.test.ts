import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  seedInitialFinanceDataForOwner: vi.fn(),
  requireOrganizationAccess: vi.fn(),
  getCurrentProfile: vi.fn(),
  getAccessibleMemberIds: vi.fn(),
  getFamilyMembersByOwner: vi.fn(),
  getReceivableIncomesForCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/finance/seed-server", () => ({
  seedInitialFinanceDataForOwner: mocks.seedInitialFinanceDataForOwner,
}));

vi.mock("@/lib/organizations/server", () => ({
  requireOrganizationAccess: mocks.requireOrganizationAccess,
}));

vi.mock("@/lib/finance/access-control", () => ({
  getCurrentProfile: mocks.getCurrentProfile,
  getAccessibleMemberIds: mocks.getAccessibleMemberIds,
}));

vi.mock("@/lib/finance/members-server", () => ({
  getFamilyMembersByOwner: mocks.getFamilyMembersByOwner,
}));

vi.mock("@/lib/finance/receivables-server", () => ({
  getReceivableIncomesForCurrentProfile: mocks.getReceivableIncomesForCurrentProfile,
}));

import { getReceivableIncomesDashboardData } from "@/lib/finance/server";

const ownerId = "owner-123";
const organizationOwnerId = "org-owner-123";
const organizationId = "org-123";

function createSupabaseAuthClient() {
  return {
    auth: {
      getClaims: vi.fn(async () => ({
        data: { claims: { sub: ownerId } },
        error: null,
      })),
    },
  };
}

describe("receivable dashboard aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createClient.mockResolvedValue(createSupabaseAuthClient());
    mocks.seedInitialFinanceDataForOwner.mockResolvedValue(undefined);
    mocks.requireOrganizationAccess.mockResolvedValue({
      organization: { id: organizationId, owner_auth_user_id: organizationOwnerId },
    });
    mocks.getCurrentProfile.mockResolvedValue({ owner_id: ownerId });
    mocks.getAccessibleMemberIds.mockResolvedValue(["member-visible"]);
  });

  it("aggregates receivable incomes by computed status and income type for visible members", async () => {
    const members = [
      {
        id: "member-visible",
        owner_id: ownerId,
        name: "Visible",
        role: null,
        monthly_limit: 1000,
        currency: "BRL",
        is_active: true,
        created_at: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "member-hidden",
        owner_id: ownerId,
        name: "Hidden",
        role: null,
        monthly_limit: 1000,
        currency: "BRL",
        is_active: true,
        created_at: "2026-05-01T00:00:00.000Z",
      },
      {
        id: "member-inactive",
        owner_id: ownerId,
        name: "Inactive",
        role: null,
        monthly_limit: 1000,
        currency: "BRL",
        is_active: false,
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ];
    const incomes = [
      {
        id: "expected-income",
        owner_id: ownerId,
        receiver_member_id: "member-visible",
        source: "Salário",
        income_type: "fixa",
        amount: 1000,
        expected_date: "2999-01-01",
        status: "previsto",
        receiving_bank: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-visible", name: "Visible" },
      },
      {
        id: "overdue-income",
        owner_id: ownerId,
        receiver_member_id: "member-visible",
        source: "Freela",
        income_type: "variavel",
        amount: 250.5,
        expected_date: "2000-01-01",
        status: "previsto",
        receiving_bank: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-visible", name: "Visible" },
      },
      {
        id: "received-past-date-income",
        owner_id: ownerId,
        receiver_member_id: "member-visible",
        source: "Recebido",
        income_type: "variavel",
        amount: 75,
        expected_date: "2000-01-01",
        status: "recebido",
        receiving_bank: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-visible", name: "Visible" },
      },
    ];

    mocks.getFamilyMembersByOwner.mockResolvedValue(members);
    mocks.getReceivableIncomesForCurrentProfile.mockResolvedValue(incomes);

    const result = await getReceivableIncomesDashboardData();

    expect(mocks.seedInitialFinanceDataForOwner).toHaveBeenCalledTimes(2);
    expect(mocks.seedInitialFinanceDataForOwner).toHaveBeenCalledWith(
      expect.anything(),
      organizationOwnerId,
      organizationId,
    );
    expect(mocks.requireOrganizationAccess).toHaveBeenCalledTimes(2);
    expect(mocks.getCurrentProfile).toHaveBeenCalledTimes(1);
    expect(mocks.getAccessibleMemberIds).toHaveBeenCalledWith("CONTAS_A_RECEBER", "can_view");
    expect(mocks.getFamilyMembersByOwner).toHaveBeenCalledWith(ownerId);

    expect(result.members.map((member) => member.id)).toEqual(["member-visible"]);
    expect(result.incomes).toEqual([
      { ...incomes[0], computed_status: "previsto" },
      { ...incomes[1], computed_status: "atrasado" },
      { ...incomes[2], computed_status: "recebido" },
    ]);
    expect(result).toMatchObject({
      totalExpected: 1000,
      totalOverdue: 250.5,
      totalReceived: 75,
      totalFixed: 1000,
      totalVariable: 325.5,
      expectedCount: 1,
      overdueCount: 1,
      receivedCount: 1,
    });
  });
});
