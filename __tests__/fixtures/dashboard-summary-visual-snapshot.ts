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
    canExpenses: true,
    visibleModuleCount: 8,
    remainingMonthlyLimit: 342.5,
    totalMonthlyLimit: 520,
    totalExpenses: 177.5,
    totalOpenDebts: 909.3,
    totalReceivableIncomes: 2120,
    usedPercent: 34,
    healthyMonth: true,
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
      color: "#f0506e",
      bg: "bg-[#f0506e]/10",
    },
    {
      key: "payable",
      title: "Nova conta/divida",
      subtitle: "Fixa ou avulsa",
      href: "/protected/contas-a-pagar",
      iconKey: "WalletCards",
      color: "#f7b84b",
      bg: "bg-[#f7b84b]/10",
    },
    {
      key: "banks",
      title: "Bancos",
      subtitle: "Saldos e contas",
      href: "/protected/bancos",
      iconKey: "Banknote",
      color: "#1de9b2",
      bg: "bg-[#1de9b2]/10",
    },
    {
      key: "admin",
      title: "Admin",
      subtitle: "Regras e acesso",
      href: "/protected/admin",
      iconKey: "ShieldCheck",
      color: "#b09cff",
      bg: "bg-[#8b72f8]/10",
    },
  ],
  summaryRows: [
    {
      key: "expenses",
      label: "Gastos do m\u00eas",
      detail: "Saidas lancadas",
      value: "177,50 \u20ac",
      iconKey: "ReceiptText",
      color: "#f0506e",
      bg: "bg-[#f0506e]/10",
    },
    {
      key: "payables",
      label: "Contas e dividas em aberto",
      detail: "Pendentes e atrasadas",
      value: "909,30 \u20ac",
      iconKey: "WalletCards",
      color: "#f7b84b",
      bg: "bg-[#f7b84b]/10",
    },
    {
      key: "banks",
      label: "Saldo em bancos",
      detail: "Contas cadastradas",
      value: "4240,00 \u20ac",
      iconKey: "Banknote",
      color: "#1de9b2",
      bg: "bg-[#1de9b2]/10",
    },
    {
      key: "receivables",
      label: "Valores a receber",
      detail: "Entradas previstas",
      value: "2120,00 \u20ac",
      iconKey: "TrendingUp",
      color: "#1de9b2",
      bg: "bg-[#1de9b2]/10",
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
