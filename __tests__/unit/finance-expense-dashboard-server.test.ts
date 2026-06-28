import { describe, expect, it } from "vitest";

import { buildExpenseDashboardData } from "@/lib/finance/expense-dashboard-server";
import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

const ownerId = "owner-123";

function createMember(overrides: Partial<DbFamilyMember>): DbFamilyMember {
  return {
    id: "member-1",
    owner_id: ownerId,
    name: "Member",
    role: null,
    monthly_limit: 500,
    currency: "BRL",
    is_active: true,
    created_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function createExpense(overrides: Partial<DbExpense>): DbExpense {
  return {
    id: "expense-1",
    owner_id: ownerId,
    family_member_id: "member-1",
    category_id: "category-1",
    expense_date: "2026-05-10",
    description: "Expense",
    purchase_location: null,
    amount: 100,
    currency: "BRL",
    payment_method: null,
    bank_or_card: null,
    notes: null,
    created_at: "2026-05-10T00:00:00.000Z",
    family_members: null,
    expense_categories: null,
    ...overrides,
  };
}

describe("expense dashboard aggregation helper", () => {
  it("filters active accessible members and computes dashboard totals", () => {
    const categories: DbExpenseCategory[] = [
      {
        id: "category-1",
        owner_id: ownerId,
        parent_category_id: null,
        name: "Mercado",
        description: null,
        is_default: true,
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ];
    const members = [
      createMember({ id: "member-visible", name: "Visible", monthly_limit: 500 }),
      createMember({ id: "member-zero", name: "Zero", monthly_limit: 0 }),
      createMember({ id: "member-hidden", name: "Hidden", monthly_limit: 1000 }),
      createMember({ id: "member-inactive", name: "Inactive", is_active: false }),
    ];
    const expenses = [
      createExpense({ id: "expense-1", family_member_id: "member-visible", amount: 300 }),
      createExpense({ id: "expense-2", family_member_id: "member-visible", amount: 250.5 }),
      createExpense({ id: "expense-3", family_member_id: "member-zero", amount: 75 }),
    ];

    const result = buildExpenseDashboardData({
      allMembers: members,
      categories,
      expenses,
      accessibleMemberIds: ["member-visible", "member-zero"],
    });

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

  it("marks members as not exceeded when remaining balance is zero or positive", () => {
    const member = createMember({ id: "member-1", monthly_limit: 200 });

    const result = buildExpenseDashboardData({
      allMembers: [member],
      categories: [],
      expenses: [createExpense({ amount: 200 })],
      accessibleMemberIds: ["member-1"],
    });

    expect(result.memberSummaries[0]).toMatchObject({
      spent: 200,
      remaining: 0,
      usedPercent: 100,
      exceeded: false,
    });
  });
});
