import { compactCurrency } from "./report-utils";

interface ReportHeroSummaryProps {
  finalMonthlyBalance: number;
  totalExpenses: number;
  totalReceivedIncomes: number;
}

export function ReportHeroSummary({
  finalMonthlyBalance,
  totalExpenses,
  totalReceivedIncomes,
}: ReportHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Saldo final projetado</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {compactCurrency(finalMonthlyBalance)}
        </p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Gastos</p>
            <p className="mt-1 text-sm font-semibold text-[#f0506e]">{compactCurrency(totalExpenses)}</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Recebido</p>
            <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{compactCurrency(totalReceivedIncomes)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
