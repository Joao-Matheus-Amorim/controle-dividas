import { getOrganizationBanksDashboardData } from "@/lib/organizations/banks";
import { getOrganizationExpenseDashboardData } from "@/lib/organizations/expenses";
import { getOrganizationPayableBillsDashboardData } from "@/lib/organizations/payables";
import { getOrganizationReceivableIncomesDashboardData } from "@/lib/organizations/receivables";

export type OrganizationReportFilters = {
  memberId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getOrganizationReportsDashboardData(filters: OrganizationReportFilters = {}) {
  const [expenseData, payableData, receivableData, bankData] = await Promise.all([
    getOrganizationExpenseDashboardData(),
    getOrganizationPayableBillsDashboardData(),
    getOrganizationReceivableIncomesDashboardData(),
    getOrganizationBanksDashboardData(),
  ]);

  const filteredExpenses = expenseData.expenses.filter((expense) => {
    const memberMatches = !filters.memberId || expense.family_member_id === filters.memberId;
    const categoryMatches = !filters.categoryId || expense.category_id === filters.categoryId;
    const fromMatches = !filters.dateFrom || expense.expense_date >= filters.dateFrom;
    const toMatches = !filters.dateTo || expense.expense_date <= filters.dateTo;

    return memberMatches && categoryMatches && fromMatches && toMatches;
  });

  const filteredBills = payableData.bills.filter((bill) => {
    const memberMatches = !filters.memberId || bill.responsible_member_id === filters.memberId;
    const fromMatches = !filters.dateFrom || bill.due_date >= filters.dateFrom;
    const toMatches = !filters.dateTo || bill.due_date <= filters.dateTo;

    return memberMatches && fromMatches && toMatches;
  });

  const filteredIncomes = receivableData.incomes.filter((income) => {
    const memberMatches = !filters.memberId || income.receiver_member_id === filters.memberId;
    const fromMatches = !filters.dateFrom || income.expected_date >= filters.dateFrom;
    const toMatches = !filters.dateTo || income.expected_date <= filters.dateTo;

    return memberMatches && fromMatches && toMatches;
  });

  const scopedMembers = filters.memberId
    ? expenseData.memberSummaries.filter((member) => member.id === filters.memberId)
    : expenseData.memberSummaries;

  const totalMonthlyLimit = scopedMembers.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  const totalExpenses = filteredExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const totalPendingBills = filteredBills
    .filter((bill) => bill.computed_status !== "pago")
    .reduce((total, bill) => total + Number(bill.amount), 0);
  const totalReceivedIncomes = filteredIncomes
    .filter((income) => income.computed_status === "recebido")
    .reduce((total, income) => total + Number(income.amount), 0);
  const totalExpectedIncomes = filteredIncomes
    .filter((income) => income.computed_status !== "recebido")
    .reduce((total, income) => total + Number(income.amount), 0);
  const finalMonthlyBalance = totalMonthlyLimit + totalReceivedIncomes - totalExpenses - totalPendingBills;

  const expensesByPerson = scopedMembers
    .map((member) => {
      const spent = filteredExpenses
        .filter((expense) => expense.family_member_id === member.id)
        .reduce((total, expense) => total + Number(expense.amount), 0);
      const limit = Number(member.monthly_limit);
      const remaining = limit - spent;
      const usedPercent = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        id: member.id,
        name: member.name,
        limit,
        spent,
        remaining,
        usedPercent,
        exceeded: remaining < 0,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const expensesByCategory = expenseData.categories
    .map((category) => {
      const total = filteredExpenses
        .filter((expense) => expense.category_id === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return {
        id: category.id,
        name: category.name,
        total,
      };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  const pendingBills = filteredBills
    .filter((bill) => bill.computed_status !== "pago")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const receivedIncomes = filteredIncomes
    .filter((income) => income.computed_status === "recebido")
    .sort((a, b) => b.expected_date.localeCompare(a.expected_date));

  const expectedIncomes = filteredIncomes
    .filter((income) => income.computed_status !== "recebido")
    .sort((a, b) => a.expected_date.localeCompare(b.expected_date));

  return {
    totalMonthlyLimit,
    totalExpenses,
    totalPendingBills,
    totalReceivedIncomes,
    totalExpectedIncomes,
    totalBankBalance: bankData.totalBalance,
    finalMonthlyBalance,
    expensesByPerson,
    expensesByCategory,
    pendingBills,
    receivedIncomes,
    expectedIncomes,
    bankAccounts: bankData.accounts,
    members: expenseData.members,
    categories: expenseData.categories,
    counts: {
      expenses: filteredExpenses.length,
      pendingBills: pendingBills.length,
      receivedIncomes: receivedIncomes.length,
      expectedIncomes: expectedIncomes.length,
      bankAccounts: bankData.accounts.length,
    },
  };
}
