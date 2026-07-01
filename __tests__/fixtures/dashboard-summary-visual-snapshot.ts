export const dashboardSummaryVisualSnapshotSurface = {
  id: "dashboard-summary-above-fold",
  route: "/protected",
  description: "dashboard summary acima da dobra",
  includes: [
    "DashboardHeader",
    "DashboardHeroSummary",
    "DashboardQuickActions",
    "DashboardSummarySection",
  ],
  excludes: [
    "DashboardFamilySummary",
    "DashboardUpcomingBills",
    "DashboardCategorySummary",
    "DashboardBankSummary",
    "DashboardIncomeSummary",
  ],
} as const;

export const dashboardSummaryVisualSnapshotViewport = {
  name: "mobile-initial",
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  colorScheme: "dark",
} as const;

export const dashboardSummaryVisualSnapshotUpdatePolicy = {
  command:
    "RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true npm run test:e2e -- tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts --update-snapshots",
  updateRule:
    "Atualizar o snapshot somente quando o contrato do dashboard acima da dobra mudar.",
  rollbackRule:
    "Reverter o snapshot, a fixture e o contrato documental no mesmo PR se o snapshot ficar instavel.",
} as const;

export const dashboardSummaryVisualSnapshotFixture = {
  header: {
    periodContextLabel: "Maio de 2026",
    heading: "Vis\u00e3o do m\u00eas",
    description: "Gastos, contas, dividas, entradas e bancos organizados em uma leitura rapida.",
    isLimitedDashboard: false,
    canAdmin: true,
  },
  hero: {
    hasCashflowView: true,
    visibleModuleCount: 8,
    totalExpenses: 177.5,
    totalOpenDebts: 909.3,
    totalReceivableIncomes: 2120,
    projectedNetFlow: 1033.2,
    positiveProjectedNetFlow: true,
    canPayables: true,
    canReceivables: true,
  },
  quickActions: [
    {
      key: "expense",
      title: "Registrar gasto",
      subtitle: "Lancamento rapido",
      href: "/protected/gastos",
      iconKey: "Plus",
      color: "var(--ff-destructive)",
      bg: "bg-ff-destructive-soft",
    },
    {
      key: "payable",
      title: "Nova conta/divida",
      subtitle: "Fixa ou avulsa",
      href: "/protected/contas-a-pagar",
      iconKey: "WalletCards",
      color: "var(--ff-warning)",
      bg: "bg-ff-warning-soft",
    },
    {
      key: "banks",
      title: "Bancos",
      subtitle: "Saldos e contas",
      href: "/protected/bancos",
      iconKey: "Banknote",
      color: "var(--ff-success)",
      bg: "bg-ff-success-soft",
    },
    {
      key: "admin",
      title: "Admin",
      subtitle: "Regras e acesso",
      href: "/protected/admin",
      iconKey: "ShieldCheck",
      color: "var(--ff-primary)",
      bg: "bg-ff-primary-soft",
    },
  ],
  summaryRows: [
    {
      key: "expenses",
      label: "Gastos do m\u00eas",
      detail: "Saidas lancadas",
      value: "177,50 \u20ac",
      iconKey: "ReceiptText",
      color: "var(--ff-destructive)",
      bg: "bg-ff-destructive-soft",
    },
    {
      key: "payables",
      label: "Contas e dividas em aberto",
      detail: "Pendentes e atrasadas",
      value: "909,30 \u20ac",
      iconKey: "WalletCards",
      color: "var(--ff-warning)",
      bg: "bg-ff-warning-soft",
    },
    {
      key: "banks",
      label: "Saldo em bancos",
      detail: "Contas cadastradas",
      value: "4240,00 \u20ac",
      iconKey: "Banknote",
      color: "var(--ff-success)",
      bg: "bg-ff-success-soft",
    },
    {
      key: "receivables",
      label: "Valores a receber",
      detail: "Entradas previstas",
      value: "2120,00 \u20ac",
      iconKey: "TrendingUp",
      color: "var(--ff-success)",
      bg: "bg-ff-success-soft",
    },
  ],
  payables: {
    canPayables: true,
    pendingCount: 3,
    totalPending: 609.3,
    overdueCount: 1,
    totalOverdue: 300,
    oneOffCount: 2,
    totalOneOff: 450,
    fixedCount: 2,
    totalFixed: 459.3,
  },
} as const;
