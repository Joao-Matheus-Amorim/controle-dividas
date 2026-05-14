import {
  Banknote,
  CalendarClock,
  CreditCard,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">
            Junho
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Família
          </h1>
          <p className="mt-1 text-sm text-white/40">Visão geral do mês</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[#b09cff]">
          ADM
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_50%,#080520_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
            Saldo familiar restante
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(remainingMonthlyLimit)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Gasto no mês
              </p>
              <p className="mt-1 text-sm font-semibold text-white/85">
                {compactCurrency(expenseData.totalExpenses)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                A receber
              </p>
              <p className="mt-1 text-sm font-semibold text-white/85">
                {compactCurrency(totalReceivableIncomes)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <ReceiptText className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
            Gastos
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {compactCurrency(expenseData.totalExpenses)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CalendarClock className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
            Contas
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {compactCurrency(totalPayableBills)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Banknote className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
            Bancos
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {compactCurrency(bankData.totalBalance)}
          </p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
          <Users className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
            Limite
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {compactCurrency(totalMonthlyLimit)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
            Membros
          </p>
          <p className="text-xs font-semibold text-[#8b72f8]">ver todos</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {expenseData.memberSummaries.map((member) => {
            const usedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
            const exceeded = member.remaining < 0;

            return (
              <div
                key={member.id}
                className="min-w-[76px] rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center"
              >
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                  {initials(member.name)}
                </div>
                <p className="mt-2 truncate text-[11px] font-semibold text-white/70">
                  {member.name}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={exceeded ? "h-full rounded-full bg-[#f0506e]" : "h-full rounded-full bg-[#8b72f8]"}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <p className={exceeded ? "mt-2 text-[11px] font-bold text-[#f0506e]" : "mt-2 text-[11px] font-bold text-[#1de9b2]"}>
                  {compactCurrency(member.remaining)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Próximos vencimentos
            </p>
            <CalendarClock className="h-4 w-4 text-white/30" />
          </div>
          {upcomingBills.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma conta pendente.</p>
          ) : (
            upcomingBills.map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
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
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Categorias
            </p>
            <TrendingDown className="h-4 w-4 text-white/30" />
          </div>
          {categorySummaries.length === 0 ? (
            <p className="text-sm text-white/35">Cadastre gastos para ver categorias.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categorySummaries.slice(0, 6).map((category) => (
                <div key={category.id} className="min-w-[92px] rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-center">
                  <p className="truncate text-[11px] font-semibold text-white/60">{category.name}</p>
                  <p className="mt-2 text-sm font-bold text-white">{compactCurrency(category.total)}</p>
                  <div className="mt-3 h-0.5 rounded-full bg-[#8b72f8]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Bancos
            </p>
            <Banknote className="h-4 w-4 text-white/30" />
          </div>
          {bankData.accounts.length === 0 ? (
            <p className="text-sm text-white/35">Nenhum banco cadastrado.</p>
          ) : (
            bankData.accounts.slice(0, 4).map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
                <div>
                  <p className="text-sm font-semibold text-white">{account.bank_name}</p>
                  <p className="mt-0.5 text-xs text-white/35">
                    {account.family_members?.name || "Sem pessoa"} · {account.account_type || "Conta"}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(account.current_balance))}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
              Rendas
            </p>
            <TrendingUp className="h-4 w-4 text-white/30" />
          </div>
          {receivableData.incomes.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma renda cadastrada.</p>
          ) : (
            receivableData.incomes.slice(0, 4).map((income) => (
              <div key={income.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1de9b2]/10 text-[#1de9b2]">
                  {income.income_type === "fixa" ? (
                    <CreditCard className="h-5 w-5" />
                  ) : (
                    <TrendingUp className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                  <p className="mt-0.5 truncate text-xs text-white/35">
                    {income.family_members?.name || "Sem pessoa"} · {income.income_type}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
