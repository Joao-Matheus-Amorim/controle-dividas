import {
  bankAccounts,
  expenseCategories,
  expenses,
  familyMembers,
  payableBills,
  receivableIncomes,
} from "./mock-data";

export const currencyFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
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

    const remaining = member.monthlyLimit - spent;
    const usedPercent = member.monthlyLimit > 0 ? (spent / member.monthlyLimit) * 100 : 0;

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
    remainingMonthlyLimit: totalMonthlyLimit - totalExpenses,
    totalPayableBills: getTotalPayableBills(),
    totalReceivableIncomes: getTotalReceivableIncomes(),
    totalBankBalance: getTotalBankBalance(),
    memberSummaries: getMemberSummaries(),
    categorySummaries: getCategorySummaries(),
    upcomingBills: getUpcomingBills(),
  };
}
