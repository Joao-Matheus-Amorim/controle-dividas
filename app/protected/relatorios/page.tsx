import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/finance/calculations";
import { getReportsDashboardData } from "@/lib/finance/reports-server";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

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

export default async function RelatoriosPage() {
  const report = await getReportsDashboardData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Junho</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Relatórios</h1>
          <p className="mt-1 text-sm text-white/40">Resumo financeiro</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
          <PieChart className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Saldo final projetado</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(report.finalMonthlyBalance)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Gastos</p>
              <p className="mt-1 text-sm font-semibold text-[#f0506e]">{compactCurrency(report.totalExpenses)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Recebido</p>
              <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{compactCurrency(report.totalReceivedIncomes)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <TrendingDown className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Gastos</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(report.totalExpenses)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CalendarClock className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pendentes</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(report.totalPendingBills)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <TrendingUp className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Rendas</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(report.totalReceivedIncomes)}</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
          <Banknote className="h-4 w-4 text-[#5caaff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Bancos</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(report.totalBankBalance)}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Gastos por pessoa</p>
            <Users className="h-4 w-4 text-white/30" />
          </div>
          {report.expensesByPerson.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma pessoa cadastrada.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {report.expensesByPerson.map((person) => (
                <div key={person.id} className="min-w-[116px] rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                      {initials(person.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{person.name}</p>
                      <p className="text-xs text-white/35">{person.usedPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-bold text-white">{compactCurrency(person.spent)}</p>
                  <p className={person.exceeded ? "mt-1 text-xs font-semibold text-[#f0506e]" : "mt-1 text-xs font-semibold text-[#1de9b2]"}>
                    saldo {compactCurrency(person.remaining)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
            <PieChart className="h-4 w-4 text-white/30" />
          </div>
          {report.expensesByCategory.length === 0 ? (
            <p className="text-sm text-white/35">Cadastre gastos para visualizar categorias.</p>
          ) : (
            <div className="space-y-2">
              {report.expensesByCategory.slice(0, 6).map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
                  <p className="truncate text-sm font-semibold text-white">{category.name}</p>
                  <p className="text-sm font-bold text-white">{compactCurrency(category.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Contas pendentes</p>
            <AlertTriangle className="h-4 w-4 text-white/30" />
          </div>
          {report.pendingBills.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma conta pendente ou atrasada.</p>
          ) : (
            report.pendingBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                    <Badge variant={bill.computed_status === "atrasado" ? "destructive" : "outline"}>{bill.computed_status}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/35">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
                  <p className="mt-0.5 text-xs text-white/25">Vence em {formatDate(bill.due_date)}</p>
                </div>
                <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Rendas recebidas</p>
            <CheckCircle2 className="h-4 w-4 text-white/30" />
          </div>
          {report.receivedIncomes.length === 0 ? (
            <p className="text-sm text-white/35">Nenhuma renda recebida cadastrada.</p>
          ) : (
            report.receivedIncomes.map((income) => (
              <div key={income.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                    <Badge variant="secondary">recebido</Badge>
                    <Badge variant="outline" className="border-white/10 text-white/50">{income.income_type}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa"} · {income.receiving_bank || "Sem banco"}</p>
                  <p className="mt-0.5 text-xs text-white/25">Data: {formatDate(income.expected_date)}</p>
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
