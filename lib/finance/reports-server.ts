import { getBanksDashboardData } from "./banks-server";
import {
  getExpenseDashboardData,
  getPayableBillsDashboardData,
  getReceivableIncomesDashboardData,
} from "./server";

export async function getReportsDashboardData() {
  const [expenseData, payableData, receivableData, bankData] = await Promise.all([
    getExpenseDashboardData(),
    getPayableBillsDashboardData(),
    getReceivableIncomesDashboardData(),
    getBanksDashboardData(),
  ]);

  const totalMonthlyLimit = expenseData.memberSummaries.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  const totalExpenses = expenseData.totalExpenses;
  const totalPendingBills = payableData.totalPending + payableData.totalOverdue;
  const totalReceivedIncomes = receivableData.totalReceived;
  const totalExpectedIncomes = receivableData.totalExpected + receivableData.totalOverdue;
  const finalMonthlyBalance = totalMonthlyLimit + totalReceivedIncomes - totalExpenses - totalPendingBills;

  const expensesByPerson = expenseData.memberSummaries
    .map((member) => ({
      id: member.id,
      name: member.name,
      limit: Number(member.monthly_limit),
      spent: member.spent,
      remaining: member.remaining,
      usedPercent: member.usedPercent,
      exceeded: member.exceeded,
    }))
    .sort((a, b) => b.spent - a.spent);

  const expensesByCategory = expenseData.categories
    .map((category) => {
      const total = expenseData.expenses
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

  const pendingBills = payableData.bills
    .filter((bill) => bill.computed_status !== "pago")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const receivedIncomes = receivableData.incomes
    .filter((income) => income.computed_status === "recebido")
    .sort((a, b) => b.expected_date.localeCompare(a.expected_date));

  const expectedIncomes = receivableData.incomes
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
    counts: {
      expenses: expenseData.expenses.length,
      pendingBills: pendingBills.length,
      receivedIncomes: receivedIncomes.length,
      expectedIncomes: expectedIncomes.length,
      bankAccounts: bankData.accounts.length,
    },
  };
}
