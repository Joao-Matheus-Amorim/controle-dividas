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
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
        <PieChart className="h-4 w-4 text-white/30" />
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-white/35">Cadastre gastos para visualizar categorias.</p>
      ) : (
        <div className="space-y-2">
          {categories.slice(0, 6).map((category) => (
            <div key={category.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
              <p className="truncate text-sm font-semibold text-white">{category.name}</p>
              <p className="text-sm font-bold text-white">{compactCurrency(category.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
