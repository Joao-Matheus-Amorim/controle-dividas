import { PieChart } from "lucide-react";

import { compactCurrency } from "./report-utils";

type ExpenseByCategory = {
  id: string;
  name: string;
  total: number;
};

interface ReportExpensesByCategoryProps {
  categories: ExpenseByCategory[];
}

export function ReportExpensesByCategory({ categories }: ReportExpensesByCategoryProps) {
  const visibleCategories = categories.slice(0, 8);
  const maxTotal = Math.max(1, ...visibleCategories.map((category) => category.total));

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Categorias</p>
        <PieChart className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-ff-subtle-foreground">Cadastre gastos para visualizar categorias.</p>
      ) : (
        <div className="space-y-2">
          {visibleCategories.map((category) => (
            <div key={category.id} className="space-y-2 rounded-2xl border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-foreground">{category.name}</p>
                <p className="text-sm font-bold text-foreground">{compactCurrency(category.total)}</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-card">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (category.total / maxTotal) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
