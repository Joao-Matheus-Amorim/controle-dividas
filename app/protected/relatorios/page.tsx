import { ReportExpensesByCategory } from "@/components/reports/report-expenses-by-category";
import { ReportExpensesByPerson } from "@/components/reports/report-expenses-by-person";
import { ReportFilterBar, type ReportFilters } from "@/components/reports/report-filter-bar";
import { ReportHeroSummary } from "@/components/reports/report-hero-summary";
import { ReportPageHeader } from "@/components/reports/report-page-header";
import { ReportPendingBills } from "@/components/reports/report-pending-bills";
import { ReportReceivedIncomes } from "@/components/reports/report-received-incomes";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { getCurrentPeriodContextLabel } from "@/lib/finance/period-context";
import { getOrganizationReportsDashboardData } from "@/lib/organizations/reports";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type RelatoriosPageProps = {
  searchParams?: PageSearchParams;
  orgSlug?: string;
};

function getSearchValue(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function RelatoriosPage({ searchParams, orgSlug }: RelatoriosPageProps) {
  const params = await searchParams;
  const filters: ReportFilters = {
    memberId: getSearchValue(params, "pessoa") ?? "",
    categoryId: getSearchValue(params, "categoria") ?? "",
    dateFrom: getSearchValue(params, "de") ?? "",
    dateTo: getSearchValue(params, "ate") ?? "",
  };

  const [report, periodContextLabel] = await Promise.all([
    getOrganizationReportsDashboardData(filters, orgSlug),
    getCurrentPeriodContextLabel(),
  ]);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <ReportPageHeader periodContextLabel={periodContextLabel} />

      <ReportHeroSummary
        finalMonthlyBalance={report.finalMonthlyBalance}
        totalExpenses={report.totalExpenses}
        totalReceivedIncomes={report.totalReceivedIncomes}
      />

      <ReportSummaryCards
        totalExpenses={report.totalExpenses}
        totalPendingBills={report.totalPendingBills}
        totalReceivedIncomes={report.totalReceivedIncomes}
        totalBankBalance={report.totalBankBalance}
      />

      <ReportFilterBar
        filters={filters}
        members={report.members}
        categories={report.categories}
        hasActiveFilters={hasActiveFilters}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportExpensesByPerson people={report.expensesByPerson} />
        <ReportExpensesByCategory categories={report.expensesByCategory} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportPendingBills bills={report.pendingBills} />
        <ReportReceivedIncomes incomes={report.receivedIncomes} />
      </section>
    </div>
  );
}

export default async function ProtectedRelatoriosPage({ searchParams }: RelatoriosPageProps) {
  return <RelatoriosPage searchParams={searchParams} />;
}
