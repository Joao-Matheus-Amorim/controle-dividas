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
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Categorias</p>
        <TrendingDown className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-ff-subtle-foreground">Cadastre gastos para ver categorias.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((category) => (
            <div key={category.id} className="min-w-0 rounded-2xl border border-border bg-background/50 p-3 text-center">
              <p className="truncate text-[11px] font-semibold text-foreground">{category.name}</p>
              <p className="mt-2 text-sm font-bold text-foreground">{compactCurrency(category.total)}</p>
              <div className="mt-3 h-0.5 rounded-full bg-ff-destructive" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
