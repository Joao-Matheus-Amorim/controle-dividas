import { Plus } from "lucide-react";

interface ExpensePageHeaderProps {
  periodLabel: string;
  canCreate: boolean;
}

export function ExpensePageHeader({ periodLabel, canCreate }: ExpensePageHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">{periodLabel}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Gastos</h1>
        <p className="mt-1 text-sm text-white/40">Lançamentos da família</p>
      </div>
      {canCreate ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
          <Plus className="h-5 w-5" />
        </div>
      ) : null}
    </section>
  );
}
