import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  seedInitialFinanceDataForOwner: vi.fn(),
  requireOrganizationAccess: vi.fn(),
  getCurrentProfile: vi.fn(),
  getAccessibleMemberIds: vi.fn(),
  getFamilyMembersByOwner: vi.fn(),
  getPayableBillsForCurrentProfile: vi.fn(),
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

vi.mock("@/lib/finance/payables-server", () => ({
  getPayableBillsForCurrentProfile: mocks.getPayableBillsForCurrentProfile,
}));

import { getPayableBillsDashboardData } from "@/lib/finance/server";

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

describe("payable dashboard aggregation", () => {
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

  it("aggregates payable bills by computed status and bill type for visible members", async () => {
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
    const bills = [
      {
        id: "pending-bill",
        owner_id: ownerId,
        name: "Internet",
        category: "Casa",
        amount: 100,
        due_date: "2999-01-01",
        responsible_member_id: "member-visible",
        status: "pendente",
        bill_type: "avulsa",
        bank_used: null,
        recurrence: null,
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-visible", name: "Visible" },
      },
      {
        id: "overdue-bill",
        owner_id: ownerId,
        name: "Aluguel",
        category: "Casa",
        amount: "250.50",
        due_date: "2000-01-01",
        responsible_member_id: "member-visible",
        status: "pendente",
        bill_type: "fixa",
        bank_used: null,
        recurrence: "mensal",
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-visible", name: "Visible" },
      },
      {
        id: "paid-past-due-bill",
        owner_id: ownerId,
        name: "Cartão pago",
        category: "Cartão",
        amount: 75,
        due_date: "2000-01-01",
        responsible_member_id: "member-visible",
        status: "pago",
        bill_type: "fixa",
        bank_used: null,
        recurrence: "mensal",
        notes: null,
        created_at: "2026-05-01T00:00:00.000Z",
        family_members: { id: "member-visible", name: "Visible" },
      },
    ];

    mocks.getFamilyMembersByOwner.mockResolvedValue(members);
    mocks.getPayableBillsForCurrentProfile.mockResolvedValue(bills);

    const result = await getPayableBillsDashboardData();

    expect(mocks.seedInitialFinanceDataForOwner).toHaveBeenCalledTimes(2);
    expect(mocks.seedInitialFinanceDataForOwner).toHaveBeenCalledWith(
      expect.anything(),
      organizationOwnerId,
      organizationId,
    );
    expect(mocks.requireOrganizationAccess).toHaveBeenCalledTimes(3);
    expect(mocks.getCurrentProfile).not.toHaveBeenCalled();
    expect(mocks.getAccessibleMemberIds).toHaveBeenCalledWith("CONTAS_A_PAGAR", "can_view");
    expect(mocks.getFamilyMembersByOwner).toHaveBeenCalledWith(organizationOwnerId, organizationId);

    expect(result.members.map((member) => member.id)).toEqual(["member-visible"]);
    expect(result.bills).toEqual([
      { ...bills[0], computed_status: "pendente" },
      { ...bills[1], computed_status: "atrasado" },
      { ...bills[2], computed_status: "pago" },
    ]);
    expect(result).toMatchObject({
      totalPending: 100,
      totalOverdue: 250.5,
      totalPaid: 75,
      totalOneOff: 100,
      totalFixed: 325.5,
      pendingCount: 1,
      overdueCount: 1,
      paidCount: 1,
      oneOffCount: 1,
      fixedCount: 2,
    });
  });
});
