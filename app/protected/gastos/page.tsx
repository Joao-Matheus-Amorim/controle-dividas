import { ExpenseCategoryStrip } from "@/components/expenses/expense-category-strip";
import { ExpenseCreateSection } from "@/components/expenses/expense-create-section";
import { ExpenseHeroSummary } from "@/components/expenses/expense-hero-summary";
import { ExpenseListSection } from "@/components/expenses/expense-list-section";
import { ExpenseMemberImpact } from "@/components/expenses/expense-member-impact";
import { ExpensePageHeader } from "@/components/expenses/expense-page-header";
import { ExpenseSummaryCards } from "@/components/expenses/expense-summary-cards";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getExpenseDashboardData } from "@/lib/finance/server";

export default async function GastosPage() {
  const [profile, expenseData] = await Promise.all([
    getCurrentProfile(),
    getExpenseDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "GASTOS");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);
  const periodLabel = getCurrentMonthLabel();

  const { members, categories, expenses, memberSummaries, totalExpenses } = expenseData;
  const totalLimit = memberSummaries.reduce((total, member) => total + Number(member.monthly_limit), 0);
  const totalRemaining = totalLimit - totalExpenses;

  const categoryTotals = categories
    .map((category) => {
      const total = expenses
        .filter((expense) => expense.category_id === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return { id: category.id, name: category.name, total };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <ExpensePageHeader periodLabel={periodLabel} canCreate={canCreate} />

      <ExpenseHeroSummary
        totalExpenses={totalExpenses}
        totalRemaining={totalRemaining}
        expenseCount={expenses.length}
      />

      <ExpenseSummaryCards
        totalExpenses={totalExpenses}
        memberCount={memberSummaries.length}
        categoryCount={categoryTotals.length}
      />

      <ExpenseCreateSection
        canCreate={canCreate}
        members={members}
        categories={categories}
      />

      <ExpenseMemberImpact members={memberSummaries} />

      <ExpenseCategoryStrip categories={categoryTotals} />

      <ExpenseListSection
        expenses={expenses}
        members={members}
        categories={categories}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
