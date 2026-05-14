import {
  Banknote,
  CalendarClock,
  CreditCard,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { AppHeroCard, AppHeroSplit } from "@/components/app/app-hero-card";
import { AppPageHeader } from "@/components/app/app-page-header";
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
      <AppPageHeader eyebrow="Junho" title="Família" description="Visão geral do mês" badge="ADM" />

      <AppHeroCard eyebrow="Saldo familiar restante" value={compactCurrency(remainingMonthlyLimit)}>
        <AppHeroSplit
          items={[
            { label: "Gasto no mês", value: compactCurrency(expenseData.totalExpenses) },
            { label: "A receber", value: compactCurrency(totalReceivableIncomes) },
          ]}
        />
      </AppHeroCard>

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
