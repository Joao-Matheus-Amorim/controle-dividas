import {
  Banknote,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { unstable_rethrow } from "next/navigation";

import {
  DashboardHeader,
  DashboardLimitedNotice,
} from "@/components/dashboard/dashboard-header";
import { DashboardHeroSummary } from "@/components/dashboard/dashboard-hero-summary";
import {
  DashboardQuickActions,
  type DashboardQuickAction,
} from "@/components/dashboard/dashboard-quick-actions";
import {
  DashboardSummarySection,
  type DashboardSummaryRow,
} from "@/components/dashboard/dashboard-summary-section";
import { DashboardFamilySummary } from "@/components/dashboard/dashboard-family-summary";
import {
  DashboardBankSummary,
  DashboardCategorySummary,
  DashboardIncomeSummary,
  DashboardUpcomingBills,
} from "@/components/dashboard/dashboard-detail-sections";
import { compactCurrency } from "@/components/dashboard/dashboard-utils";
import { getVisibleModuleKeys } from "@/lib/finance/access-control";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import { getCurrentPeriodContextLabel } from "@/lib/finance/period-context";
import { getOrganizationBanksDashboardData } from "@/lib/organizations/banks";
import { getOrganizationExpenseDashboardData } from "@/lib/organizations/expenses";
import { getOrganizationPayableBillsDashboardData } from "@/lib/organizations/payables";
import { getOrganizationReceivableIncomesDashboardData } from "@/lib/organizations/receivables";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { getCurrentOrganization } from "@/lib/organizations/server";

const dashboardModules: FinanceModuleKey[] = [
  "DASHBOARD",
  "PESSOAS",
  "GASTOS",
  "CONTAS_A_PAGAR",
  "CONTAS_A_RECEBER",
  "BANCOS",
  "RELATORIOS",
  "ADMIN",
];

type DashboardPageProps = {
  orgSlug?: string;
};

export async function DashboardPage({ orgSlug }: DashboardPageProps = {}) {
  const [
    visibleModuleKeysResult,
    expenseDataResult,
    payableDataResult,
    receivableDataResult,
    bankDataResult,
    periodContextLabelResult,
    currentOrganizationResult,
  ] = await Promise.allSettled([
    getVisibleModuleKeys(dashboardModules, orgSlug),
    getOrganizationExpenseDashboardData(orgSlug),
    getOrganizationPayableBillsDashboardData(orgSlug),
    getOrganizationReceivableIncomesDashboardData(orgSlug),
    getOrganizationBanksDashboardData(orgSlug),
    getCurrentPeriodContextLabel(),
    getCurrentOrganization(orgSlug),
  ]);

  const logDashboardLoadError = (source: string, reason: unknown) => {
    unstable_rethrow(reason);
    console.error(`[dashboard] ${source} failed`, reason);
  };

  const visibleModuleKeys =
    visibleModuleKeysResult.status === "fulfilled"
      ? visibleModuleKeysResult.value
      : (logDashboardLoadError("visible modules", visibleModuleKeysResult.reason), []);

  const expenseData =
    expenseDataResult.status === "fulfilled"
      ? expenseDataResult.value
      : (logDashboardLoadError("expenses", expenseDataResult.reason), {
          members: [],
          categories: [],
          expenses: [],
          memberSummaries: [],
          totalExpenses: 0,
        });

  const payableData =
    payableDataResult.status === "fulfilled"
      ? payableDataResult.value
      : (logDashboardLoadError("payables", payableDataResult.reason), {
          members: [],
          bills: [],
          totalPending: 0,
          totalOverdue: 0,
          totalPaid: 0,
          totalOneOff: 0,
          totalFixed: 0,
          pendingCount: 0,
          overdueCount: 0,
          paidCount: 0,
          oneOffCount: 0,
          fixedCount: 0,
        });

  const receivableData =
    receivableDataResult.status === "fulfilled"
      ? receivableDataResult.value
      : (logDashboardLoadError("receivables", receivableDataResult.reason), {
          members: [],
          incomes: [],
          totalExpected: 0,
          totalOverdue: 0,
          totalReceived: 0,
          totalFixed: 0,
          totalVariable: 0,
          expectedCount: 0,
          overdueCount: 0,
          receivedCount: 0,
        });

  const bankData =
    bankDataResult.status === "fulfilled"
      ? bankDataResult.value
      : (logDashboardLoadError("banks", bankDataResult.reason), {
          members: [],
          accounts: [],
          accountsByMember: [],
          totalBalance: 0,
          totalAccounts: 0,
        });

  const periodContextLabel =
    periodContextLabelResult.status === "fulfilled"
      ? periodContextLabelResult.value
      : (logDashboardLoadError("period context", periodContextLabelResult.reason), "Periodo atual");

  const currentOrganization =
    currentOrganizationResult.status === "fulfilled"
      ? currentOrganizationResult.value
      : (logDashboardLoadError("current organization", currentOrganizationResult.reason), null);

  const visibleModules = new Set(visibleModuleKeys);
  const canPeople = visibleModules.has("PESSOAS");
  const canExpenses = visibleModules.has("GASTOS");
  const canPayables = visibleModules.has("CONTAS_A_PAGAR");
  const canReceivables = visibleModules.has("CONTAS_A_RECEBER");
  const canBanks = visibleModules.has("BANCOS");
  const canAdmin = visibleModules.has("ADMIN");
  const isLimitedDashboard = visibleModuleKeys.length < dashboardModules.length;

  const totalMonthlyLimit = canExpenses
    ? expenseData.memberSummaries.reduce((total, member) => total + Number(member.monthly_limit), 0)
    : 0;
  const remainingMonthlyLimit = totalMonthlyLimit - (canExpenses ? expenseData.totalExpenses : 0);
  const totalOpenDebts = canPayables ? payableData.totalPending + payableData.totalOverdue : 0;
  const totalReceivableIncomes = canReceivables ? receivableData.totalExpected + receivableData.totalOverdue : 0;
  const usedPercent = totalMonthlyLimit > 0
    ? Math.min((expenseData.totalExpenses / totalMonthlyLimit) * 100, 100)
    : 0;
  const healthyMonth = remainingMonthlyLimit >= 0;

  const categorySummaries = canExpenses
    ? expenseData.categories
        .map((category) => {
          const total = expenseData.expenses
            .filter((expense) => expense.category_id === category.id)
            .reduce((sum, expense) => sum + Number(expense.amount), 0);

          return { id: category.id, name: category.name, total };
        })
        .filter((category) => category.total > 0)
        .sort((a, b) => b.total - a.total)
    : [];

  const upcomingBills = canPayables
    ? payableData.bills.filter((bill) => bill.computed_status !== "pago").slice(0, 4)
    : [];

  const quickActions: DashboardQuickAction[] = [
    canExpenses
      ? {
          href: getOrgPathFromProtectedPath("/protected/gastos", orgSlug),
          title: "Registrar gasto",
          subtitle: "Lançamento rápido",
          icon: Plus,
        }
      : null,
    canPayables
      ? {
          href: getOrgPathFromProtectedPath("/protected/contas-a-pagar", orgSlug),
          title: "Nova conta/divida",
          subtitle: "Fixa ou avulsa",
          icon: WalletCards,
        }
      : null,
    canBanks
      ? {
          href: getOrgPathFromProtectedPath("/protected/bancos", orgSlug),
          title: "Bancos",
          subtitle: "Saldos e contas",
          icon: Banknote,
        }
      : null,
    canAdmin
      ? {
          href: getOrgPathFromProtectedPath("/protected/admin", orgSlug),
          title: "Admin",
          subtitle: "Regras e acesso",
          icon: ShieldCheck,
        }
      : null,
  ].filter(Boolean) as DashboardQuickAction[];

  const summaryRows: DashboardSummaryRow[] = [
    canExpenses
      ? {
          label: "Gastos do mês",
          detail: "Saídas lançadas",
          value: compactCurrency(expenseData.totalExpenses),
          icon: ReceiptText,
          color: "rgb(var(--ff-destructive))",
          bg: "bg-ff-destructive-soft",
        }
      : null,
    canPayables
      ? {
          label: "Contas e dividas em aberto",
          detail: "Pendentes e atrasadas",
          value: compactCurrency(totalOpenDebts),
          icon: WalletCards,
          color: "rgb(var(--ff-warning))",
          bg: "bg-ff-warning-soft",
        }
      : null,
    canBanks
      ? {
          label: "Saldo em bancos",
          detail: "Contas cadastradas",
          value: compactCurrency(bankData.totalBalance),
          icon: Banknote,
          color: "rgb(var(--ff-success))",
          bg: "bg-ff-success-soft",
        }
      : null,
    canReceivables
      ? {
          label: "Valores a receber",
          detail: "Entradas previstas",
          value: compactCurrency(totalReceivableIncomes),
          icon: TrendingUp,
          color: "rgb(var(--ff-success))",
          bg: "bg-ff-success-soft",
        }
      : null,
  ].filter(Boolean) as DashboardSummaryRow[];

  return (
    <div className="app-container">
      <DashboardHeader
        periodContextLabel={periodContextLabel}
        orgName={currentOrganization?.name}
        isLimitedDashboard={isLimitedDashboard}
        canAdmin={canAdmin}
      />

      {isLimitedDashboard ? <DashboardLimitedNotice /> : null}

      <DashboardHeroSummary
        canExpenses={canExpenses}
        visibleModuleCount={visibleModuleKeys.length}
        remainingMonthlyLimit={remainingMonthlyLimit}
        totalMonthlyLimit={totalMonthlyLimit}
        totalExpenses={expenseData.totalExpenses}
        totalOpenDebts={totalOpenDebts}
        totalReceivableIncomes={totalReceivableIncomes}
        usedPercent={usedPercent}
        healthyMonth={healthyMonth}
        canPayables={canPayables}
        canReceivables={canReceivables}
      />

      <DashboardQuickActions actions={quickActions} />

      <DashboardSummarySection
        rows={summaryRows}
        canPayables={canPayables}
        canExpenses={canExpenses}
        usedPercent={usedPercent}
        pendingCount={payableData.pendingCount}
        totalPending={payableData.totalPending}
        overdueCount={payableData.overdueCount}
        totalOverdue={payableData.totalOverdue}
        oneOffCount={payableData.oneOffCount}
        totalOneOff={payableData.totalOneOff}
        fixedCount={payableData.fixedCount}
        totalFixed={payableData.totalFixed}
      />

      <DashboardFamilySummary
        canExpenses={canExpenses}
        canPeople={canPeople}
        members={expenseData.memberSummaries}
        orgSlug={orgSlug}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardUpcomingBills canPayables={canPayables} bills={upcomingBills} />
        <DashboardCategorySummary canExpenses={canExpenses} categories={categorySummaries} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardBankSummary canBanks={canBanks} accounts={bankData.accounts} />
        <DashboardIncomeSummary canReceivables={canReceivables} incomes={receivableData.incomes} />
      </section>
    </div>
  );
}
