import { compactCurrency } from "./expense-utils";

interface ExpenseHeroSummaryProps {
  totalExpenses: number;
  totalRemaining: number;
  expenseCount: number;
}

export function ExpenseHeroSummary({
  totalExpenses,
  totalRemaining,
  expenseCount,
}: ExpenseHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f0506e]/20 bg-[linear-gradient(135deg,#2b0f22_0%,#140814_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f0506e]/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total gasto no mês</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{compactCurrency(totalExpenses)}</p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Saldo restante</p>
            <p className={totalRemaining < 0 ? "mt-1 text-sm font-semibold text-[#f0506e]" : "mt-1 text-sm font-semibold text-[#1de9b2]"}>
              {compactCurrency(totalRemaining)}
            </p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Lançamentos</p>
            <p className="mt-1 text-sm font-semibold text-white/85">{expenseCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
