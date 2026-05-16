import { TrendingDown } from "lucide-react";

import { compactCurrency } from "./expense-utils";

type CategoryTotal = {
  id: string;
  name: string;
  total: number;
};

interface ExpenseCategoryStripProps {
  categories: CategoryTotal[];
}

export function ExpenseCategoryStrip({ categories }: ExpenseCategoryStripProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
        <TrendingDown className="h-4 w-4 text-white/30" />
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-white/35">Cadastre gastos para ver categorias.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.slice(0, 8).map((category) => (
            <div key={category.id} className="min-w-[92px] rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-center">
              <p className="truncate text-[11px] font-semibold text-white/60">{category.name}</p>
              <p className="mt-2 text-sm font-bold text-white">{compactCurrency(category.total)}</p>
              <div className="mt-3 h-0.5 rounded-full bg-[#f0506e]" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
