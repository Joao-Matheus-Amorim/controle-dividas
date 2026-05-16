import { ExpenseCategoryStrip } from "@/components/expenses/expense-category-strip";
import { ExpenseCreateSection } from "@/components/expenses/expense-create-section";
import { ExpenseFilterBar, type ExpenseFilters } from "@/components/expenses/expense-filter-bar";
import { ExpenseHeroSummary } from "@/components/expenses/expense-hero-summary";
import { ExpenseListSection } from "@/components/expenses/expense-list-section";
import { ExpenseMemberImpact } from "@/components/expenses/expense-member-impact";
import { ExpensePageHeader } from "@/components/expenses/expense-page-header";
import { ExpenseSummaryCards } from "@/components/expenses/expense-summary-cards";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getExpenseDashboardData } from "@/lib/finance/server";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type GastosPageProps = {
  searchParams?: PageSearchParams;
};

function getSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const params = await searchParams;
  const filters: ExpenseFilters = {
    memberId: getSearchValue(params, "pessoa") ?? "",
    categoryId: getSearchValue(params, "categoria") ?? "",
    paymentMethod: getSearchValue(params, "pagamento") ?? "",
    dateFrom: getSearchValue(params, "de") ?? "",
    dateTo: getSearchValue(params, "ate") ?? "",
  };

  const [profile, expenseData] = await Promise.all([
    getCurrentProfile(),
    getExpenseDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "GASTOS");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);
  const periodLabel = getCurrentMonthLabel();

  const { members, categories, expenses, memberSummaries } = expenseData;
  const filteredExpenses = expenses.filter((expense) => {
    const memberMatches = !filters.memberId || expense.family_member_id === filters.memberId;
    const categoryMatches = !filters.categoryId || expense.category_id === filters.categoryId;
    const paymentMatches = !filters.paymentMethod || expense.payment_method === filters.paymentMethod;
    const fromMatches = !filters.dateFrom || expense.expense_date >= filters.dateFrom;
    const toMatches = !filters.dateTo || expense.expense_date <= filters.dateTo;

    return memberMatches && categoryMatches && paymentMatches && fromMatches && toMatches;
  });

  const totalExpenses = filteredExpenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const totalLimit = memberSummaries.reduce((total, member) => total + Number(member.monthly_limit), 0);
  const totalRemaining = totalLimit - totalExpenses;

  const filteredMemberSummaries = memberSummaries.map((member) => {
    const spent = filteredExpenses
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

  const categoryTotals = categories
    .map((category) => {
      const total = filteredExpenses
        .filter((expense) => expense.category_id === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return { id: category.id, name: category.name, total };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  const paymentMethods = Array.from(
    new Set(
      expenses
        .map((expense) => expense.payment_method)
        .filter((method): method is string => Boolean(method)),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <ExpensePageHeader periodLabel={periodLabel} canCreate={canCreate} />

      <ExpenseHeroSummary
        totalExpenses={totalExpenses}
        totalRemaining={totalRemaining}
        expenseCount={filteredExpenses.length}
      />

      <ExpenseSummaryCards
        totalExpenses={totalExpenses}
        memberCount={filteredMemberSummaries.length}
        categoryCount={categoryTotals.length}
      />

      <ExpenseCreateSection
        canCreate={canCreate}
        members={members}
        categories={categories}
      />

      <ExpenseFilterBar
        filters={filters}
        members={members}
        categories={categories}
        paymentMethods={paymentMethods}
        hasActiveFilters={hasActiveFilters}
      />

      <ExpenseMemberImpact members={filteredMemberSummaries} />

      <ExpenseCategoryStrip categories={categoryTotals} />

      <ExpenseListSection
        expenses={filteredExpenses}
        members={members}
        categories={categories}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
