import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  seedInitialFinanceDataForOwner: vi.fn(),
  requireOrganizationAccess: vi.fn(),
  getCurrentProfile: vi.fn(),
  getAccessibleMemberIds: vi.fn(),
  getFamilyMembersByOwner: vi.fn(),
  getExpenseCategoriesByOwner: vi.fn(),
  getExpensesForCurrentProfile: vi.fn(),
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

vi.mock("@/lib/finance/categories-server", () => ({
  getExpenseCategoriesByOwner: mocks.getExpenseCategoriesByOwner,
}));

vi.mock("@/lib/finance/expenses-server", () => ({
  getExpensesForCurrentProfile: mocks.getExpensesForCurrentProfile,
}));

import {
  getExpenseCategories,
  getExpenseDashboardData,
  getFamilyMembers,
} from "@/lib/finance/server";

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

describe("expense dashboard aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createClient.mockResolvedValue(createSupabaseAuthClient());
    mocks.seedInitialFinanceDataForOwner.mockResolvedValue(undefined);
    mocks.requireOrganizationAccess.mockResolvedValue({
      organization: { id: organizationId, owner_auth_user_id: organizationOwnerId },
    });
    mocks.getCurrentProfile.mockResolvedValue({ owner_id: ownerId });
    mocks.getAccessibleMemberIds.mockResolvedValue(["member-visible", "member-zero"]);
  });

  it("aggregates only active accessible members and visible expenses", async () => {
    const categories = [{ id: "category-1", owner_id: ownerId, name: "Mercado" }];
    const expenses = [
      { id: "expense-1", family_member_id: "member-visible", amount: 300 },
      { id: "expense-2", family_member_id: "member-visible", amount: "250.50" },
      { id: "expense-3", family_member_id: "member-zero", amount: 75 },
    ];
    const members = [
      {
        id: "member-visible",
        owner_id: ownerId,
        name: "Visible",
        monthly_limit: 500,
        is_active: true,
      },
      {
        id: "member-zero",
        owner_id: ownerId,
        name: "Zero limit",
        monthly_limit: 0,
        is_active: true,
      },
      {
        id: "member-hidden",
        owner_id: ownerId,
        name: "Hidden",
        monthly_limit: 1000,
        is_active: true,
      },
      {
        id: "member-inactive",
        owner_id: ownerId,
        name: "Inactive",
        monthly_limit: 1000,
        is_active: false,
      },
    ];

    mocks.getFamilyMembersByOwner.mockResolvedValue(members);
    mocks.getExpenseCategoriesByOwner.mockResolvedValue(categories);
    mocks.getExpensesForCurrentProfile.mockResolvedValue(expenses);

    const result = await getExpenseDashboardData();

    expect(mocks.seedInitialFinanceDataForOwner).not.toHaveBeenCalled();
    expect(mocks.requireOrganizationAccess).toHaveBeenCalledTimes(1);
    expect(mocks.getCurrentProfile).not.toHaveBeenCalled();
    expect(mocks.getAccessibleMemberIds).toHaveBeenCalledWith("GASTOS", "can_view");
    expect(mocks.getFamilyMembersByOwner).toHaveBeenCalledWith(organizationOwnerId, organizationId);
    expect(mocks.getExpenseCategoriesByOwner).toHaveBeenCalledWith(organizationOwnerId, organizationId);

    expect(result.members.map((member) => member.id)).toEqual([
      "member-visible",
      "member-zero",
    ]);
    expect(result.categories).toBe(categories);
    expect(result.expenses).toBe(expenses);
    expect(result.totalExpenses).toBe(625.5);
    expect(result.memberSummaries).toEqual([
      {
        ...members[0],
        spent: 550.5,
        remaining: -50.5,
        usedPercent: 110.1,
        exceeded: true,
      },
      {
        ...members[1],
        spent: 75,
        remaining: -75,
        usedPercent: 0,
        exceeded: true,
      },
    ]);
  });

  it("reads legacy members and categories with the active organization owner without seeding", async () => {
    const members = [{ id: "member-visible", owner_id: organizationOwnerId, is_active: true }];
    const categories = [{ id: "category-1", owner_id: organizationOwnerId, name: "Mercado" }];

    mocks.getFamilyMembersByOwner.mockResolvedValue(members);
    mocks.getExpenseCategoriesByOwner.mockResolvedValue(categories);

    await expect(getFamilyMembers()).resolves.toBe(members);
    await expect(getExpenseCategories()).resolves.toBe(categories);

    expect(mocks.seedInitialFinanceDataForOwner).not.toHaveBeenCalled();
    expect(mocks.requireOrganizationAccess).toHaveBeenCalledTimes(2);
    expect(mocks.getFamilyMembersByOwner).toHaveBeenCalledWith(organizationOwnerId, organizationId);
    expect(mocks.getExpenseCategoriesByOwner).toHaveBeenCalledWith(organizationOwnerId, organizationId);
    expect(mocks.getFamilyMembersByOwner).not.toHaveBeenCalledWith(ownerId);
    expect(mocks.getExpenseCategoriesByOwner).not.toHaveBeenCalledWith(ownerId);
  });
});
