import type { DbExpense, DbExpenseCategory, DbFamilyMember } from "@/lib/finance/types";

export type ExpenseMemberSummary = DbFamilyMember & {
  spent: number;
  remaining: number;
  usedPercent: number;
  exceeded: boolean;
};

export function buildExpenseDashboardData({
  allMembers,
  categories,
  expenses,
  accessibleMemberIds,
}: {
  allMembers: DbFamilyMember[];
  categories: DbExpenseCategory[];
  expenses: DbExpense[];
  accessibleMemberIds: string[];
}) {
  const members = allMembers
    .filter((member) => member.is_active)
    .filter((member) => accessibleMemberIds.includes(member.id));

  const memberSummaries: ExpenseMemberSummary[] = members.map((member) => {
    const spent = expenses
      .filter((expense) => expense.family_member_id === member.id)
      .reduce((total, expense) => total + Number(expense.amount), 0);

    const monthlyLimit = Number(member.monthly_limit);
    const remaining = monthlyLimit - spent;
    const usedPercent = monthlyLimit > 0 ? (spent / monthlyLimit) * 100 : 0;

    return {
      ...member,
      spent,
      remaining,
      usedPercent,
      exceeded: remaining < 0,
    };
  });

  return {
    members,
    categories,
    expenses,
    memberSummaries,
    totalExpenses: expenses.reduce((total, expense) => total + Number(expense.amount), 0),
  };
}
