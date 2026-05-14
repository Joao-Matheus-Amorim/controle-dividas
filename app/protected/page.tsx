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
import { AppStatCard } from "@/components/app/app-stat-card";
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

export default async function ProtectedPage() {
  const [expenseData, payableData, receivableData, bankData] = await Promise.all([
    getExpenseDashboardData(),
    getPayableBillsDashboardData(),
    getReceivableIncomesDashboardData(),
    getBanksDashboardData(),
  ]);

  const totalMonthlyLimit = expenseData.memberSummaries.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );
  const remainingMonthlyLimit = totalMonthlyLimit - expenseData.totalExpenses;
  const totalPayableBills = payableData.totalPending + payableData.totalOverdue;
  const totalReceivableIncomes = receivableData.totalExpected + receivableData.totalOverdue;
  const usedPercent = totalMonthlyLimit > 0
    ? Math.min((expenseData.totalExpenses / totalMonthlyLimit) * 100, 100)
    : 0;
  const healthyMonth = remainingMonthlyLimit >= 0;

  const categorySummaries = expenseData.categories
    .map((category) => {
      const total = expenseData.expenses
        .filter((expense) => expense.category_id === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return {
        id: category.id,
        name: category.name,
        total,
      };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  const upcomingBills = payableData.bills
    .filter((bill) => bill.computed_status !== "pago")
    .slice(0, 4);

  return (
    <div className="app-container">
      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/25">
            Junho · Família
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-white md:text-5xl">
            Visão do mês
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
            Limites, contas e entradas organizados em uma leitura rápida.
          </p>
        </div>
        <Link
          href="/protected/admin"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-[#b09cff] shadow-[0_16px_42px_rgba(0,0,0,0.25)] transition active:scale-[0.96]"
          aria-label="Abrir admin"
        >
          <ShieldCheck className="h-5 w-5" />
        </Link>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_85%_12%,rgba(139,114,248,0.28),transparent_34%),linear-gradient(145deg,#17112f_0%,#0b0b14_52%,#07070c_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-white/10 bg-white/[0.035]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
                Disponível
              </p>
              <p className="mt-2 truncate text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">
                {compactCurrency(remainingMonthlyLimit)}
              </p>
            </div>
            <div className={healthyMonth ? "shrink-0 rounded-full border border-[#1de9b2]/20 bg-[#1de9b2]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1de9b2]" : "shrink-0 rounded-full border border-[#f0506e]/20 bg-[#f0506e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0506e]"}>
              {healthyMonth ? "saudável" : "atenção"}
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={healthyMonth ? "h-full rounded-full bg-[#8b72f8]" : "h-full rounded-full bg-[#f0506e]"}
              style={{ width: `${usedPercent}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Gasto</p>
              <p className="mt-1 truncate text-sm font-bold text-white">{compactCurrency(expenseData.totalExpenses)}</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Limite</p>
              <p className="mt-1 truncate text-sm font-bold text-white">{compactCurrency(totalMonthlyLimit)}</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Receber</p>
              <p className="mt-1 truncate text-sm font-bold text-[#1de9b2]">{compactCurrency(totalReceivableIncomes)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <AppSectionTitle>Ações rápidas</AppSectionTitle>
          <p className="text-xs font-medium text-white/30">Atalhos do dia</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Link href="/protected/gastos" className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition active:scale-[0.97] hover:border-[#f0506e]/35 hover:bg-[#f0506e]/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e] transition group-hover:scale-105">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold text-white">Registrar gasto</p>
              <p className="truncate text-xs text-white/30">Lançamento rápido</p>
            </div>
          </Link>
          <Link href="/protected/contas-a-pagar" className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition active:scale-[0.97] hover:border-[#f7b84b]/35 hover:bg-[#f7b84b]/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7b84b]/10 text-[#f7b84b] transition group-hover:scale-105">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold text-white">Nova conta</p>
              <p className="truncate text-xs text-white/30">Vencimentos</p>
            </div>
          </Link>
          <Link href="/protected/bancos" className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition active:scale-[0.97] hover:border-[#1de9b2]/35 hover:bg-[#1de9b2]/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1de9b2]/10 text-[#1de9b2] transition group-hover:scale-105">
              <Banknote className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold text-white">Bancos</p>
              <p className="truncate text-xs text-white/30">Saldos e contas</p>
            </div>
          </Link>
          <Link href="/protected/admin" className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition active:scale-[0.97] hover:border-[#8b72f8]/35 hover:bg-[#8b72f8]/10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8b72f8]/10 text-[#b09cff] transition group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold text-white">Admin</p>
              <p className="truncate text-xs text-white/30">Regras e acesso</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
        <AppStatCard title="Gastos" value={compactCurrency(expenseData.totalExpenses)} icon={ReceiptText} tone="danger" />
        <AppStatCard title="Contas" value={compactCurrency(totalPayableBills)} icon={CalendarClock} tone="warning" />
        <AppStatCard title="Bancos" value={compactCurrency(bankData.totalBalance)} icon={Banknote} tone="success" />
        <AppStatCard className="hidden md:block" title="Limite" value={compactCurrency(totalMonthlyLimit)} icon={Users} tone="primary" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <AppSectionTitle>Membros</AppSectionTitle>
          <p className="text-xs font-semibold text-[#8b72f8]">ver todos</p>
        </div>
        <div className="app-scrollbar-hidden flex gap-2 overflow-x-auto pb-1">
          {expenseData.memberSummaries.map((member) => {
            const usedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
            const exceeded = member.remaining < 0;

            return (
              <AppCard key={member.id} padding="sm" interactive className="min-w-[76px] text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                  {initials(member.name)}
                </div>
                <p className="mt-2 truncate text-[11px] font-semibold text-white/70">{member.name}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={exceeded ? "h-full rounded-full bg-[#f0506e]" : "h-full rounded-full bg-[#8b72f8]"}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <p className={exceeded ? "mt-2 text-[11px] font-bold text-[#f0506e]" : "mt-2 text-[11px] font-bold text-[#1de9b2]"}>
                  {compactCurrency(member.remaining)}
                </p>
              </AppCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AppCard className="space-y-3">
          <div className="flex items-center justify-between">
            <AppSectionTitle>Próximos vencimentos</AppSectionTitle>
            <CalendarClock className="h-4 w-4 text-white/30" />
          </div>
          {upcomingBills.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma conta pendente.</p>
          ) : (
            upcomingBills.map((bill) => (
              <AppCard key={bill.id} variant="inner" padding="sm" className="flex items-center gap-3">
                <div className={bill.computed_status === "atrasado" ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e]" : "flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7b84b]/10 text-[#f7b84b]"}>
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                  <p className="mt-0.5 truncate text-xs text-white/35">
                    {bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
                  <p className={bill.computed_status === "atrasado" ? "text-[10px] font-bold uppercase tracking-wider text-[#f0506e]" : "text-[10px] font-bold uppercase tracking-wider text-[#f7b84b]"}>
                    {bill.computed_status}
                  </p>
                </div>
              </AppCard>
            ))
          )}
        </AppCard>

        <AppCard className="space-y-3">
          <div className="flex items-center justify-between">
            <AppSectionTitle>Categorias</AppSectionTitle>
            <TrendingDown className="h-4 w-4 text-white/30" />
          </div>
          {categorySummaries.length === 0 ? (
            <p className="text-sm text-white/35">Cadastre gastos para ver categorias.</p>
          ) : (
            <div className="app-scrollbar-hidden flex gap-2 overflow-x-auto pb-1">
              {categorySummaries.slice(0, 6).map((category) => (
                <AppCard key={category.id} variant="inner" padding="sm" className="min-w-[92px] text-center">
                  <p className="truncate text-[11px] font-semibold text-white/60">{category.name}</p>
                  <p className="mt-2 text-sm font-bold text-white">{compactCurrency(category.total)}</p>
                  <div className="mt-3 h-0.5 rounded-full bg-[#8b72f8]" />
                </AppCard>
              ))}
            </div>
          )}
        </AppCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <AppCard className="space-y-3">
          <div className="flex items-center justify-between">
            <AppSectionTitle>Bancos</AppSectionTitle>
            <Banknote className="h-4 w-4 text-white/30" />
          </div>
          {bankData.accounts.length === 0 ? (
            <p className="text-sm text-white/35">Nenhum banco cadastrado.</p>
          ) : (
            bankData.accounts.slice(0, 4).map((account) => (
              <AppCard key={account.id} variant="inner" padding="sm" className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{account.bank_name}</p>
                  <p className="mt-0.5 text-xs text-white/35">
                    {account.family_members?.name || "Sem pessoa"} · {account.account_type || "Conta"}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(account.current_balance))}</p>
              </AppCard>
            ))
          )}
        </AppCard>

        <AppCard className="space-y-3">
          <div className="flex items-center justify-between">
            <AppSectionTitle>Rendas</AppSectionTitle>
            <TrendingUp className="h-4 w-4 text-white/30" />
          </div>
          {receivableData.incomes.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma renda cadastrada.</p>
          ) : (
            receivableData.incomes.slice(0, 4).map((income) => (
              <AppCard key={income.id} variant="inner" padding="sm" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1de9b2]/10 text-[#1de9b2]">
                  {income.income_type === "fixa" ? <CreditCard className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                  <p className="mt-0.5 truncate text-xs text-white/35">
                    {income.family_members?.name || "Sem pessoa"} · {income.income_type}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
              </AppCard>
            ))
          )}
        </AppCard>
      </section>
    </div>
  );
}
