import { ReceiptText, TrendingDown, Users } from "lucide-react";

import { compactCurrency } from "./expense-utils";

interface ExpenseSummaryCardsProps {
  totalExpenses: number;
  memberCount: number;
  categoryCount: number;
}

export function ExpenseSummaryCards({
  totalExpenses,
  memberCount,
  categoryCount,
}: ExpenseSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <ReceiptText className="h-4 w-4 text-[#f0506e]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Gastos</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalExpenses)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <Users className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pessoas</p>
        <p className="mt-1 text-sm font-bold text-white">{memberCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <TrendingDown className="h-4 w-4 text-[#f7b84b]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Categorias</p>
        <p className="mt-1 text-sm font-bold text-white">{categoryCount}</p>
      </div>
    </section>
  );
}
