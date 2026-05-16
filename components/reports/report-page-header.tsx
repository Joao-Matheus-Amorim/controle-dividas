import { PieChart } from "lucide-react";

interface ReportPageHeaderProps {
  periodContextLabel: string;
}

export function ReportPageHeader({ periodContextLabel }: ReportPageHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">{periodContextLabel}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Relatórios</h1>
        <p className="mt-1 text-sm text-white/40">Resumo financeiro</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
        <PieChart className="h-5 w-5" />
      </div>
    </section>
  );
}
