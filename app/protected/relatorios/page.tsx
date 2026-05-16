import { ReportExpensesByCategory } from "@/components/reports/report-expenses-by-category";
import { ReportExpensesByPerson } from "@/components/reports/report-expenses-by-person";
import { ReportHeroSummary } from "@/components/reports/report-hero-summary";
import { ReportPageHeader } from "@/components/reports/report-page-header";
import { ReportPendingBills } from "@/components/reports/report-pending-bills";
import { ReportReceivedIncomes } from "@/components/reports/report-received-incomes";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { getCurrentPeriodContextLabel } from "@/lib/finance/period-context";
import { getReportsDashboardData } from "@/lib/finance/reports-server";

export default async function RelatoriosPage() {
  const [report, periodContextLabel] = await Promise.all([
    getReportsDashboardData(),
    getCurrentPeriodContextLabel(),
  ]);

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
