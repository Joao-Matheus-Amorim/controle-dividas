import {
  Banknote,
  Plus,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { unstable_rethrow } from "next/navigation";

import {
  DashboardHeader,
  DashboardLimitedNotice,
} from "@/components/dashboard/dashboard-header";
import { DashboardHeroSummary } from "@/components/dashboard/dashboard-hero-summary";
import { DashboardAiInsights } from "@/components/dashboard/dashboard-ai-insights";
import {
  DashboardQuickActions,
  type DashboardQuickAction,
} from "@/components/dashboard/dashboard-quick-actions";
import {
  DashboardAdminFocus,
  type DashboardAdminFocusItem,
} from "@/components/dashboard/dashboard-admin-focus";
import {
  DashboardReadinessChecklist,
  type DashboardReadinessChecklistItem,
} from "@/components/dashboard/dashboard-readiness-checklist";
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
import { compactCurrencyForCode } from "@/components/dashboard/dashboard-utils";
import { getVisibleModuleKeys } from "@/lib/finance/access-control";
import { buildExpenseCategoryLabelMap } from "@/lib/finance/category-labels";
import {
  formatAmountsInCurrency,
  formatGroupedCurrencyTotals,
  summarizeAmountsInCurrency,
  type MoneyAmount,
} from "@/lib/finance/currency-summary";
import { generateDashboardInsights, type GenerateDashboardInsightsContext } from "@/lib/ai/dashboard-insights-provider";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import { getCurrentPeriodContextLabel } from "@/lib/finance/period-context";
import { getOrganizationBanksDashboardData } from "@/lib/organizations/banks";
import { getOrganizationExpenseDashboardData } from "@/lib/organizations/expenses";
import { getOrganizationPayableBillsDashboardData } from "@/lib/organizations/payables";
import { getOrganizationFamilyMembers } from "@/lib/organizations/people";
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
    peopleDataResult,
    periodContextLabelResult,
    currentOrganizationResult,
  ] = await Promise.allSettled([
    getVisibleModuleKeys(dashboardModules, orgSlug),
    getOrganizationExpenseDashboardData(orgSlug),
    getOrganizationPayableBillsDashboardData(orgSlug),
    getOrganizationReceivableIncomesDashboardData(orgSlug),
    getOrganizationBanksDashboardData(orgSlug),
    getOrganizationFamilyMembers(orgSlug),
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

  const peopleData =
    peopleDataResult.status === "fulfilled"
      ? peopleDataResult.value
      : (logDashboardLoadError("people", peopleDataResult.reason), []);

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

  const hasCashflowView = canExpenses || canPayables || canReceivables;
  const displayCurrency = currentOrganization?.display_currency ?? "EUR";

  const expenseAmounts: MoneyAmount[] = canExpenses
    ? expenseData.expenses.map((expense) => ({
        amount: Number(expense.amount),
        currency: expense.currency,
      }))
    : [];
  const openDebtAmounts: MoneyAmount[] = canPayables
    ? payableData.bills
        .filter((bill) => bill.computed_status !== "pago")
        .map((bill) => ({
          amount: Number(bill.amount),
          currency: bill.currency,
        }))
    : [];
  const receivableAmounts: MoneyAmount[] = canReceivables
    ? receivableData.incomes
        .filter((income) => income.computed_status !== "recebido")
        .map((income) => ({
          amount: Number(income.amount),
          currency: income.currency,
        }))
    : [];
  const bankAmounts: MoneyAmount[] = canBanks
    ? bankData.accounts.map((account) => ({
        amount: Number(account.current_balance),
        currency: account.currency,
      }))
    : [];
  const monthlyLimitAmounts: MoneyAmount[] = canExpenses
    ? expenseData.memberSummaries.map((member) => ({
        amount: Number(member.monthly_limit),
        currency: member.currency,
      }))
    : [];

  const [
    convertedExpenses,
    convertedOpenDebts,
    convertedReceivables,
    convertedBanks,
    convertedMonthlyLimit,
  ] = await Promise.all([
    summarizeAmountsInCurrency(expenseAmounts, displayCurrency),
    summarizeAmountsInCurrency(openDebtAmounts, displayCurrency),
    summarizeAmountsInCurrency(receivableAmounts, displayCurrency),
    summarizeAmountsInCurrency(bankAmounts, displayCurrency),
    summarizeAmountsInCurrency(monthlyLimitAmounts, displayCurrency),
  ]);

  const usedPercent = convertedMonthlyLimit.total > 0
    ? Math.min((convertedExpenses.total / convertedMonthlyLimit.total) * 100, 100)
    : 0;

  const totalExpensesLabel = convertedExpenses.complete
    ? compactCurrencyForCode(convertedExpenses.total, displayCurrency)
    : formatGroupedCurrencyTotals(expenseAmounts);
  const totalOpenDebtsLabel = convertedOpenDebts.complete
    ? compactCurrencyForCode(convertedOpenDebts.total, displayCurrency)
    : formatGroupedCurrencyTotals(openDebtAmounts);
  const totalReceivableIncomesLabel = convertedReceivables.complete
    ? compactCurrencyForCode(convertedReceivables.total, displayCurrency)
    : formatGroupedCurrencyTotals(receivableAmounts);
  const totalBankBalanceLabel = convertedBanks.complete
    ? compactCurrencyForCode(convertedBanks.total, displayCurrency)
    : formatGroupedCurrencyTotals(bankAmounts);
  const projectedNetFlowDisplayTotal = convertedReceivables.complete && convertedExpenses.complete && convertedOpenDebts.complete
    ? convertedReceivables.total - (convertedExpenses.total + convertedOpenDebts.total)
    : null;
  const projectedNetFlowLabel = projectedNetFlowDisplayTotal !== null
    ? compactCurrencyForCode(projectedNetFlowDisplayTotal, displayCurrency)
    : `${totalReceivableIncomesLabel} x ${totalExpensesLabel}`;
  const positiveProjectedNetFlowDisplay = projectedNetFlowDisplayTotal !== null
    ? projectedNetFlowDisplayTotal >= 0
    : true;
  const monthlyFlowLabel = `${totalReceivableIncomesLabel} de entradas contra ${totalExpensesLabel} de saídas`;
  const pendingBillsLabel = await formatAmountsInCurrency(
    payableData.bills
      .filter((bill) => bill.computed_status === "pendente")
      .map((bill) => ({ amount: Number(bill.amount), currency: bill.currency })),
    displayCurrency,
  );
  const overdueBillsLabel = await formatAmountsInCurrency(
    payableData.bills
      .filter((bill) => bill.computed_status === "atrasado")
      .map((bill) => ({ amount: Number(bill.amount), currency: bill.currency })),
    displayCurrency,
  );
  const oneOffBillsLabel = await formatAmountsInCurrency(
    payableData.bills
      .filter((bill) => bill.bill_type === "avulsa")
      .map((bill) => ({ amount: Number(bill.amount), currency: bill.currency })),
    displayCurrency,
  );
  const fixedBillsLabel = await formatAmountsInCurrency(
    payableData.bills
      .filter((bill) => bill.bill_type === "fixa")
      .map((bill) => ({ amount: Number(bill.amount), currency: bill.currency })),
    displayCurrency,
  );

  const categorySummaries = canExpenses
    ? await (async () => {
        const categoryLabels = buildExpenseCategoryLabelMap(expenseData.categories);
        const totals = await Promise.all(
          expenseData.categories.map(async (category) => {
            const categoryExpenses = expenseData.expenses.filter((expense) => expense.category_id === category.id);
            const convertedCategory = await summarizeAmountsInCurrency(
              categoryExpenses.map((expense) => ({
                amount: Number(expense.amount),
                currency: expense.currency,
              })),
              displayCurrency,
            );

            return {
              id: category.id,
              name: categoryLabels.get(category.id) ?? category.name,
              total: convertedCategory.total,
              currency: displayCurrency,
              totalLabel: convertedCategory.complete
                ? compactCurrencyForCode(convertedCategory.total, displayCurrency)
                : formatGroupedCurrencyTotals(
                  categoryExpenses.map((expense) => ({
                    amount: Number(expense.amount),
                    currency: expense.currency,
                  })),
                ),
              conversionIncomplete: !convertedCategory.complete,
              expenseCount: categoryExpenses.length,
            };
          }),
        );

        return totals
          .filter((category) => category.expenseCount > 0)
          .sort((a, b) => b.total - a.total);
      })()
    : [];

  const upcomingBills = canPayables
    ? payableData.bills
        .filter((bill) => bill.computed_status !== "pago")
        .sort((left, right) => {
          const leftPriority = left.computed_status === "atrasado" ? 0 : 1;
          const rightPriority = right.computed_status === "atrasado" ? 0 : 1;

          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

          return Number(right.amount) - Number(left.amount);
        })
        .slice(0, 4)
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

  const hasActivePerson = peopleData.some((member) => member.is_active);

  const readinessChecklistItems: DashboardReadinessChecklistItem[] = [
    canPeople
      ? {
          href: getOrgPathFromProtectedPath("/protected/pessoas", orgSlug),
          title: "Pessoa do owner",
          detail: "Cadastro base para vincular lancamentos.",
          isComplete: hasActivePerson,
        }
      : null,
    canBanks
      ? {
          href: getOrgPathFromProtectedPath("/protected/bancos", orgSlug),
          title: "Banco",
          detail: "Conta ou cartao para movimentar saldo.",
          isComplete: bankData.accounts.length > 0,
        }
      : null,
    canExpenses
      ? {
          href: getOrgPathFromProtectedPath("/protected/gastos", orgSlug),
          title: "Gasto",
          detail: "Primeira saida lancada no mes.",
          isComplete: expenseData.expenses.length > 0,
        }
      : null,
    canPayables
      ? {
          href: getOrgPathFromProtectedPath("/protected/contas-a-pagar", orgSlug),
          title: "Conta a pagar",
          detail: "Divida fixa ou avulsa cadastrada.",
          isComplete: payableData.bills.length > 0,
        }
      : null,
    canReceivables
      ? {
          href: getOrgPathFromProtectedPath("/protected/contas-a-receber", orgSlug),
          title: "Conta a receber",
          detail: "Entrada prevista ou recebida cadastrada.",
          isComplete: receivableData.incomes.length > 0,
        }
      : null,
  ].filter(Boolean) as DashboardReadinessChecklistItem[];

  const incompleteReadinessItems = readinessChecklistItems.filter((item) => !item.isComplete);
  const overLimitMembers = canExpenses
    ? expenseData.memberSummaries.filter((member) => member.remaining < 0)
    : [];

  const adminFocusItems: DashboardAdminFocusItem[] = [
    canPayables && payableData.overdueCount > 0
      ? {
          title: "Contas atrasadas",
          detail: `${payableData.overdueCount} item(ns) em atraso somando ${await formatAmountsInCurrency(
            payableData.bills
              .filter((bill) => bill.computed_status === "atrasado")
              .map((bill) => ({ amount: Number(bill.amount), currency: bill.currency })),
            displayCurrency,
          )}.`,
          href: getOrgPathFromProtectedPath("/protected/contas-a-pagar", orgSlug),
          tone: "danger",
        }
      : null,
    canExpenses && overLimitMembers.length > 0
      ? {
          title: "Limites estourados",
          detail: `${overLimitMembers.length} pessoa(s) ja passaram do limite do mes.`,
          href: getOrgPathFromProtectedPath("/protected/gastos", orgSlug),
          tone: "warning",
        }
      : null,
    incompleteReadinessItems.length > 0
      ? {
          title: "Base ainda incompleta",
          detail: `${incompleteReadinessItems.length} etapa(s) de cadastro ainda faltam para operar melhor.`,
          href: incompleteReadinessItems[0]?.href,
          tone: "warning",
        }
      : null,
    canReceivables && receivableData.overdueCount > 0
      ? {
          title: "Recebimentos atrasados",
          detail: `${receivableData.overdueCount} entrada(s) seguem sem receber.`,
          href: getOrgPathFromProtectedPath("/protected/contas-a-receber", orgSlug),
          tone: "warning",
        }
      : null,
    !(
      (canPayables && payableData.overdueCount > 0) ||
      (canExpenses && overLimitMembers.length > 0) ||
      incompleteReadinessItems.length > 0 ||
      (canReceivables && receivableData.overdueCount > 0)
    )
      ? {
          title: "Operacao em dia",
          detail: "Sem atraso relevante, sem limite estourado e com base principal cadastrada.",
          tone: "success",
        }
      : null,
  ].filter(Boolean) as DashboardAdminFocusItem[];

  const summaryRows: DashboardSummaryRow[] = [
    canExpenses
      ? {
          label: "Gastos do mês",
          detail: "Saídas lançadas",
          value: totalExpensesLabel,
          iconKey: "expenses",
          color: "rgb(var(--ff-destructive))",
          bg: "bg-ff-destructive-soft",
        }
      : null,
    canPayables
      ? {
          label: "Contas e dividas em aberto",
          detail: "Pendentes e atrasadas",
          value: totalOpenDebtsLabel,
          iconKey: "payables",
          color: "rgb(var(--ff-warning))",
          bg: "bg-ff-warning-soft",
        }
      : null,
    canBanks
      ? {
          label: "Saldo em bancos",
          detail: "Contas cadastradas",
          value: totalBankBalanceLabel,
          iconKey: "banks",
          color: "rgb(var(--ff-success))",
          bg: "bg-ff-success-soft",
        }
      : null,
    canReceivables
      ? {
          label: "Valores a receber",
          detail: "Entradas previstas",
          value: totalReceivableIncomesLabel,
          iconKey: "receivables",
          color: "rgb(var(--ff-success))",
          bg: "bg-ff-success-soft",
        }
      : null,
  ].filter(Boolean) as DashboardSummaryRow[];
  const insightsContext: GenerateDashboardInsightsContext = {
    memberNames: peopleData.map((m) => m.name).filter(Boolean),
    categoryNames: canExpenses ? expenseData.categories.map((c) => c.name).filter(Boolean) : [],
    displayCurrency,
    periodLabel: periodContextLabel,
    totalBankBalanceLabel: canBanks ? totalBankBalanceLabel : undefined,
  };
  const dashboardInsights = await generateDashboardInsights({
    hasCashflowView,
    positiveProjectedNetFlow: positiveProjectedNetFlowDisplay,
    projectedNetFlowLabel,
    monthlyFlowLabel,
    canExpenses,
    canPayables,
    canReceivables,
    usedPercent,
    overdueBillCount: payableData.overdueCount,
    overdueBillsLabel,
    pendingBillCount: payableData.pendingCount,
    topCategoryName: categorySummaries[0]?.name,
    topCategoryTotalLabel: categorySummaries[0]?.totalLabel,
    receivableOverdueCount: receivableData.overdueCount,
    incompleteSetupCount: incompleteReadinessItems.length,
  }, insightsContext);

  return (
    <div className="app-container">
      <DashboardHeader
        periodContextLabel={periodContextLabel}
        orgName={currentOrganization?.name}
        isLimitedDashboard={isLimitedDashboard}
        canAdmin={canAdmin}
        orgSlug={orgSlug}
      />

      {isLimitedDashboard ? <DashboardLimitedNotice /> : null}

      <DashboardHeroSummary
        hasCashflowView={hasCashflowView}
        visibleModuleCount={visibleModuleKeys.length}
        totalExpensesLabel={totalExpensesLabel}
        totalOpenDebtsLabel={totalOpenDebtsLabel}
        totalReceivableIncomesLabel={totalReceivableIncomesLabel}
        projectedNetFlowLabel={projectedNetFlowLabel}
        monthlyFlowLabel={monthlyFlowLabel}
        displayCurrency={displayCurrency}
        positiveProjectedNetFlow={positiveProjectedNetFlowDisplay}
        canPayables={canPayables}
        canReceivables={canReceivables}
      />

      <DashboardQuickActions actions={quickActions} />

      <DashboardAiInsights insights={dashboardInsights} />

      <DashboardReadinessChecklist items={readinessChecklistItems} />

      <DashboardSummarySection
        rows={summaryRows}
        canPayables={canPayables}
        canExpenses={canExpenses}
        usedPercent={usedPercent}
        pendingCount={payableData.pendingCount}
        totalPendingLabel={pendingBillsLabel}
        overdueCount={payableData.overdueCount}
        totalOverdueLabel={overdueBillsLabel}
        oneOffCount={payableData.oneOffCount}
        totalOneOffLabel={oneOffBillsLabel}
        fixedCount={payableData.fixedCount}
        totalFixedLabel={fixedBillsLabel}
      />

      <DashboardAdminFocus items={adminFocusItems} />

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
