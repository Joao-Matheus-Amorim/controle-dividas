import {
  bankAccounts,
  expenseCategories,
  expenses,
  familyMembers,
  payableBills,
  receivableIncomes,
} from "@/__tests__/fixtures/mock-data";

export {
  compactCurrency,
  currencyFormatter,
  formatCurrency,
} from "@/lib/finance/formatting";

export function calculateRemainingLimit(monthlyLimit: number, spent: number) {
  return monthlyLimit - spent;
}

export function calculateUsedPercent(spent: number, monthlyLimit: number) {
  if (!Number.isFinite(spent) || !Number.isFinite(monthlyLimit)) {
    return 0;
  }

  if (monthlyLimit <= 0 || spent <= 0) {
    return 0;
  }

  return (spent / monthlyLimit) * 100;
}

export function getMemberName(memberId: string) {
  return familyMembers.find((member) => member.id === memberId)?.name ?? "Não informado";
}

export function getCategoryName(categoryId: string) {
  return expenseCategories.find((category) => category.id === categoryId)?.name ?? "Outros";
}

export function getTotalMonthlyLimit() {
  return familyMembers.reduce((total, member) => total + member.monthlyLimit, 0);
}

export function getTotalExpenses() {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getTotalPayableBills() {
  return payableBills
    .filter((bill) => bill.status !== "pago")
    .reduce((total, bill) => total + bill.amount, 0);
}

export function getTotalReceivableIncomes() {
  return receivableIncomes
    .filter((income) => income.status !== "recebido")
    .reduce((total, income) => total + income.amount, 0);
}

export function getTotalBankBalance() {
  return bankAccounts.reduce((total, account) => total + account.currentBalance, 0);
}

export function getMemberSummaries() {
  return familyMembers.map((member) => {
    const spent = expenses
      .filter((expense) => expense.familyMemberId === member.id)
      .reduce((total, expense) => total + expense.amount, 0);

    const remaining = calculateRemainingLimit(member.monthlyLimit, spent);
    const usedPercent = calculateUsedPercent(spent, member.monthlyLimit);

    return {
      ...member,
      spent,
      remaining,
      usedPercent,
      exceeded: remaining < 0,
    };
  });
}

export function getCategorySummaries() {
  return expenseCategories
    .map((category) => {
      const total = expenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        ...category,
        total,
      };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function getUpcomingBills() {
  return [...payableBills]
    .filter((bill) => bill.status !== "pago")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getDashboardSummary() {
  const totalMonthlyLimit = getTotalMonthlyLimit();
  const totalExpenses = getTotalExpenses();

  return {
    totalMonthlyLimit,
    totalExpenses,
    remainingMonthlyLimit: calculateRemainingLimit(totalMonthlyLimit, totalExpenses),
    totalPayableBills: getTotalPayableBills(),
    totalReceivableIncomes: getTotalReceivableIncomes(),
    totalBankBalance: getTotalBankBalance(),
    memberSummaries: getMemberSummaries(),
    categorySummaries: getCategorySummaries(),
    upcomingBills: getUpcomingBills(),
  };
}
