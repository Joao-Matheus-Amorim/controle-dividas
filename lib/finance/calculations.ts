export {
  compactCurrency,
  currencyFormatter,
  formatCurrency,
} from "@/lib/finance/formatting";

type MemberLike = {
  id: string;
  name: string;
  monthlyLimit: number;
};

type CategoryLike = {
  id: string;
  name: string;
};

type ExpenseLike = {
  familyMemberId: string;
  categoryId: string;
  amount: number;
};

type PayableLike = {
  status: string;
  dueDate: string;
  amount: number;
};

type ReceivableLike = {
  status: string;
  amount: number;
};

type BankAccountLike = {
  currentBalance: number;
};

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

export function getMemberName(memberId: string, members: MemberLike[] = []) {
  return members.find((member) => member.id === memberId)?.name ?? "Nao informado";
}

export function getCategoryName(categoryId: string, categories: CategoryLike[] = []) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Outros";
}

export function getTotalMonthlyLimit(members: MemberLike[] = []) {
  return members.reduce((total, member) => total + member.monthlyLimit, 0);
}

export function getTotalExpenses(expenses: ExpenseLike[] = []) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function getTotalPayableBills(payableBills: PayableLike[] = []) {
  return payableBills
    .filter((bill) => bill.status !== "pago")
    .reduce((total, bill) => total + bill.amount, 0);
}

export function getTotalReceivableIncomes(receivableIncomes: ReceivableLike[] = []) {
  return receivableIncomes
    .filter((income) => income.status !== "recebido")
    .reduce((total, income) => total + income.amount, 0);
}

export function getTotalBankBalance(bankAccounts: BankAccountLike[] = []) {
  return bankAccounts.reduce((total, account) => total + account.currentBalance, 0);
}

export function getMemberSummaries(members: MemberLike[] = [], expenses: ExpenseLike[] = []) {
  return members.map((member) => {
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

export function getCategorySummaries(categories: CategoryLike[] = [], expenses: ExpenseLike[] = []) {
  return categories
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

export function getUpcomingBills(payableBills: PayableLike[] = []) {
  return [...payableBills]
    .filter((bill) => bill.status !== "pago")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getDashboardSummary({
  members = [],
  categories = [],
  expenses = [],
  payableBills = [],
  receivableIncomes = [],
  bankAccounts = [],
}: {
  members?: MemberLike[];
  categories?: CategoryLike[];
  expenses?: ExpenseLike[];
  payableBills?: PayableLike[];
  receivableIncomes?: ReceivableLike[];
  bankAccounts?: BankAccountLike[];
} = {}) {
  const totalMonthlyLimit = getTotalMonthlyLimit(members);
  const totalExpenses = getTotalExpenses(expenses);

  return {
    totalMonthlyLimit,
    totalExpenses,
    remainingMonthlyLimit: calculateRemainingLimit(totalMonthlyLimit, totalExpenses),
    totalPayableBills: getTotalPayableBills(payableBills),
    totalReceivableIncomes: getTotalReceivableIncomes(receivableIncomes),
    totalBankBalance: getTotalBankBalance(bankAccounts),
    memberSummaries: getMemberSummaries(members, expenses),
    categorySummaries: getCategorySummaries(categories, expenses),
    upcomingBills: getUpcomingBills(payableBills),
  };
}
