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
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
        <TrendingDown className="h-4 w-4 text-white/30" />
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-white/35">Cadastre gastos para ver categorias.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((category) => (
            <div key={category.id} className="min-w-0 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-center">
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
