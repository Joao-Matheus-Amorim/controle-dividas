import {
  Banknote,
  CalendarClock,
  CreditCard,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { getVisibleModuleKeys } from "@/lib/finance/access-control";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import { formatCurrency } from "@/lib/finance/calculations";
import { getBanksDashboardData } from "@/lib/finance/banks-server";
import {
  getExpenseDashboardData,
  getPayableBillsDashboardData,
  getReceivableIncomesDashboardData,
} from "@/lib/finance/server";

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
  const [visibleModuleKeys, expenseData, payableData, receivableData, bankData] = await Promise.all([
    getVisibleModuleKeys(dashboardModules),
    getExpenseDashboardData(),
    getPayableBillsDashboardData(),
    getReceivableIncomesDashboardData(),
    getBanksDashboardData(),
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
  const totalPayableBills = canPayables ? payableData.totalPending + payableData.totalOverdue : 0;
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

  const quickActions = [
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
          title: "Nova conta",
          subtitle: "Vencimentos",
          icon: CalendarClock,
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
  ].filter(Boolean) as Array<{
    href: string;
    title: string;
    subtitle: string;
    icon: typeof Plus;
    color: string;
    bg: string;
  }>;

  const summaryRows = [
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
          label: "Contas em aberto",
          detail: "Pendentes e atrasadas",
          value: compactCurrency(totalPayableBills),
          icon: CalendarClock,
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
  ].filter(Boolean) as Array<{
    label: string;
    detail: string;
    value: string;
    icon: typeof ReceiptText;
    color: string;
    bg: string;
  }>;

  return (
    <div className="app-container">
      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/25">Junho · Família</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-white md:text-5xl">
            Visão do mês
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
            {isLimitedDashboard
              ? "Você está vendo apenas os módulos liberados para o seu perfil."
              : "Limites, contas e entradas organizados em uma leitura rápida."}
          </p>
        </div>
        {canAdmin ? (
          <Link
            href="/protected/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-[#b09cff] shadow-[0_16px_42px_rgba(0,0,0,0.25)] transition active:scale-[0.96]"
            aria-label="Abrir admin"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>
        ) : null}
      </section>

      {isLimitedDashboard ? (
        <section className="rounded-[1.5rem] border border-[#8b72f8]/20 bg-[#8b72f8]/10 p-4 text-sm text-[#b09cff]">
          Visão limitada pelo Admin. Menus, dados e ações aparecem conforme suas permissões.
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_85%_12%,rgba(139,114,248,0.28),transparent_34%),linear-gradient(145deg,#17112f_0%,#0b0b14_52%,#07070c_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-white/10 bg-white/[0.035]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
                {canExpenses ? "Disponível" : "Resumo liberado"}
              </p>
              <p className="mt-2 truncate text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">
                {canExpenses ? compactCurrency(remainingMonthlyLimit) : `${visibleModuleKeys.length} módulos`}
              </p>
            </div>
            {canExpenses ? (
              <div className={healthyMonth ? "shrink-0 rounded-full border border-[#1de9b2]/20 bg-[#1de9b2]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1de9b2]" : "shrink-0 rounded-full border border-[#f0506e]/20 bg-[#f0506e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0506e]"}>
                {healthyMonth ? "saudável" : "atenção"}
              </div>
            ) : null}
          </div>

          {canExpenses ? (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={healthyMonth ? "h-full rounded-full bg-[#8b72f8]" : "h-full rounded-full bg-[#f0506e]"}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-2">
            {canExpenses ? (
              <>
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Gasto</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">{compactCurrency(expenseData.totalExpenses)}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Limite</p>
                  <p className="mt-1 truncate text-sm font-bold text-white">{compactCurrency(totalMonthlyLimit)}</p>
                </div>
              </>
            ) : null}
            {canReceivables ? (
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Receber</p>
                <p className="mt-1 truncate text-sm font-bold text-[#1de9b2]">{compactCurrency(totalReceivableIncomes)}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {quickActions.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <AppSectionTitle>Ações rápidas</AppSectionTitle>
            <p className="text-xs font-medium text-white/30">Atalhos liberados</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition active:scale-[0.97] hover:bg-white/[0.07]"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.bg} transition group-hover:scale-105`} style={{ color: action.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-bold text-white">{action.title}</p>
                    <p className="truncate text-xs text-white/30">{action.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {summaryRows.length > 0 ? (
        <section className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <AppCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <AppSectionTitle>Resumo financeiro</AppSectionTitle>
                <p className="mt-1 text-sm text-white/35">Apenas módulos liberados</p>
              </div>
              <ReceiptText className="h-4 w-4 text-white/25" />
            </div>

            <div className="space-y-2">
              {summaryRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${row.bg}`} style={{ color: row.color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{row.label}</p>
                        <p className="truncate text-xs text-white/30">{row.detail}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-white">{row.value}</p>
                  </div>
                );
              })}
            </div>
          </AppCard>

          {canExpenses ? (
            <AppCard className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <AppSectionTitle>Uso do limite</AppSectionTitle>
                  <p className="mt-1 text-sm text-white/35">{usedPercent.toFixed(0)}% utilizado</p>
                </div>
                <Users className="h-4 w-4 text-white/25" />
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-[#080810]/45 p-4">
                <p className="text-3xl font-black tracking-[-0.05em] text-white">{usedPercent.toFixed(0)}%</p>
                <p className="mt-1 text-xs text-white/35">do limite permitido foi usado</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={healthyMonth ? "h-full rounded-full bg-[#8b72f8]" : "h-full rounded-full bg-[#f0506e]"}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
              </div>
            </AppCard>
          ) : null}
        </section>
      ) : null}

      {canExpenses && expenseData.memberSummaries.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <AppSectionTitle>Família</AppSectionTitle>
              <p className="mt-1 text-sm text-white/35">Membros dentro do seu escopo</p>
            </div>
            {canPeople ? <Link href="/protected/pessoas" className="text-xs font-semibold text-[#8b72f8]">ver todos</Link> : null}
          </div>

          <AppCard className="space-y-2">
            {expenseData.memberSummaries.map((member) => {
              const memberUsedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
              const exceeded = member.remaining < 0;

              return (
                <div key={member.id} className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                      {initials(member.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                        <p className={exceeded ? "shrink-0 text-sm font-bold text-[#f0506e]" : "shrink-0 text-sm font-bold text-[#1de9b2]"}>
                          {compactCurrency(member.remaining)}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={exceeded ? "h-full rounded-full bg-[#f0506e]" : "h-full rounded-full bg-[#8b72f8]"}
                          style={{ width: `${memberUsedPercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-white/30">
                        {compactCurrency(member.spent)} usados de {compactCurrency(Number(member.monthly_limit))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </AppCard>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {canPayables ? (
          <AppCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <AppSectionTitle>Próximos vencimentos</AppSectionTitle>
                <p className="mt-1 text-sm text-white/35">Contas dentro do seu escopo</p>
              </div>
              <CalendarClock className="h-4 w-4 text-white/30" />
            </div>
            {upcomingBills.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Nenhuma conta pendente.</div>
            ) : (
              <div className="space-y-2">
                {upcomingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                    <div className={bill.computed_status === "atrasado" ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e]" : "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f7b84b]/10 text-[#f7b84b]"}>
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                      <p className="mt-0.5 truncate text-xs text-white/35">
                        {bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
                      <p className={bill.computed_status === "atrasado" ? "text-[10px] font-bold uppercase tracking-wider text-[#f0506e]" : "text-[10px] font-bold uppercase tracking-wider text-[#f7b84b]"}>{bill.computed_status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        ) : null}

        {canExpenses ? (
          <AppCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <AppSectionTitle>Categorias</AppSectionTitle>
                <p className="mt-1 text-sm text-white/35">Maiores saídas liberadas</p>
              </div>
              <TrendingDown className="h-4 w-4 text-white/30" />
            </div>
            {categorySummaries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Cadastre gastos para ver categorias.</div>
            ) : (
              <div className="space-y-2">
                {categorySummaries.slice(0, 5).map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white/45">{index + 1}</div>
                      <p className="min-w-0 truncate text-sm font-semibold text-white/65">{category.name}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-white">{compactCurrency(category.total)}</p>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {canBanks ? (
          <AppCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <AppSectionTitle>Bancos</AppSectionTitle>
                <p className="mt-1 text-sm text-white/35">Saldos dentro do seu escopo</p>
              </div>
              <Banknote className="h-4 w-4 text-white/30" />
            </div>
            {bankData.accounts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Nenhum banco cadastrado.</div>
            ) : (
              <div className="space-y-2">
                {bankData.accounts.slice(0, 4).map((account) => (
                  <div key={account.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{account.bank_name}</p>
                      <p className="mt-0.5 truncate text-xs text-white/35">{account.family_members?.name || "Sem pessoa"} · {account.account_type || "Conta"}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(account.current_balance))}</p>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        ) : null}

        {canReceivables ? (
          <AppCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <AppSectionTitle>Rendas</AppSectionTitle>
                <p className="mt-1 text-sm text-white/35">Entradas dentro do seu escopo</p>
              </div>
              <TrendingUp className="h-4 w-4 text-white/30" />
            </div>
            {receivableData.incomes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">Nenhuma renda cadastrada.</div>
            ) : (
              <div className="space-y-2">
                {receivableData.incomes.slice(0, 4).map((income) => (
                  <div key={income.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1de9b2]/10 text-[#1de9b2]">
                      {income.income_type === "fixa" ? <CreditCard className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                      <p className="mt-0.5 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa"} · {income.income_type}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
                  </div>
                ))}
              </div>
            )}
          </AppCard>
        ) : null}
      </section>
    </div>
  );
}
