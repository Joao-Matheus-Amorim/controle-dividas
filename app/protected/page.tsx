import {
  Banknote,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

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
import { getBanksDashboardData } from "@/lib/finance/banks-server";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import { getCurrentPeriodContextLabel } from "@/lib/finance/period-context";
import {
  getExpenseDashboardData,
  getPayableBillsDashboardData,
  getReceivableIncomesDashboardData,
} from "@/lib/finance/server";

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

export default async function ProtectedPage() {
  const [visibleModuleKeys, expenseData, payableData, receivableData, bankData, periodContextLabel] = await Promise.all([
    getVisibleModuleKeys(dashboardModules),
    getExpenseDashboardData(),
    getPayableBillsDashboardData(),
    getReceivableIncomesDashboardData(),
    getBanksDashboardData(),
    getCurrentPeriodContextLabel(),
  ]);

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
          href: "/protected/gastos",
          title: "Registrar gasto",
          subtitle: "Lançamento rápido",
          icon: Plus,
          color: "#f0506e",
          bg: "bg-[#f0506e]/10",
        }
      : null,
    canPayables
      ? {
          href: "/protected/contas-a-pagar",
          title: "Nova conta/divida",
          subtitle: "Fixa ou avulsa",
          icon: WalletCards,
          color: "#f7b84b",
          bg: "bg-[#f7b84b]/10",
        }
      : null,
    canBanks
      ? {
          href: "/protected/bancos",
          title: "Bancos",
          subtitle: "Saldos e contas",
          icon: Banknote,
          color: "#1de9b2",
          bg: "bg-[#1de9b2]/10",
        }
      : null,
    canAdmin
      ? {
          href: "/protected/admin",
          title: "Admin",
          subtitle: "Regras e acesso",
          icon: ShieldCheck,
          color: "#b09cff",
          bg: "bg-[#8b72f8]/10",
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
          color: "#f0506e",
          bg: "bg-[#f0506e]/10",
        }
      : null,
    canPayables
      ? {
          label: "Contas e dividas em aberto",
          detail: "Pendentes e atrasadas",
          value: compactCurrency(totalOpenDebts),
          icon: WalletCards,
          color: "#f7b84b",
          bg: "bg-[#f7b84b]/10",
        }
      : null,
    canBanks
      ? {
          label: "Saldo em bancos",
          detail: "Contas cadastradas",
          value: compactCurrency(bankData.totalBalance),
          icon: Banknote,
          color: "#1de9b2",
          bg: "bg-[#1de9b2]/10",
        }
      : null,
    canReceivables
      ? {
          label: "Valores a receber",
          detail: "Entradas previstas",
          value: compactCurrency(totalReceivableIncomes),
          icon: TrendingUp,
          color: "#1de9b2",
          bg: "bg-[#1de9b2]/10",
        }
      : null,
  ].filter(Boolean) as DashboardSummaryRow[];

  return (
    <div className="app-container">
      <DashboardHeader
        periodContextLabel={periodContextLabel}
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
