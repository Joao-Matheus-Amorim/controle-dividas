import { Banknote, CalendarClock, TrendingDown, TrendingUp } from "lucide-react";

import { compactCurrency } from "./report-utils";

interface ReportSummaryCardsProps {
  totalExpenses: number;
  totalPendingBills: number;
  totalReceivedIncomes: number;
  totalBankBalance: number;
}

export function ReportSummaryCards({
  totalExpenses,
  totalPendingBills,
  totalReceivedIncomes,
  totalBankBalance,
}: ReportSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <TrendingDown className="h-4 w-4 text-[#f0506e]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Gastos</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalExpenses)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <CalendarClock className="h-4 w-4 text-[#f7b84b]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pendentes</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPendingBills)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <TrendingUp className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Rendas</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalReceivedIncomes)}</p>
      </div>
      <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
        <Banknote className="h-4 w-4 text-[#5caaff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Bancos</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalBankBalance)}</p>
      </div>
    </section>
  );
}
