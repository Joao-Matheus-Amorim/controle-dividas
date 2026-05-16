import { BellRing, Euro, ShieldCheck } from "lucide-react";

import { compactCurrency } from "./settings-utils";

interface SettingsSummaryCardsProps {
  totalLimit: number;
  categoryCount: number;
}

export function SettingsSummaryCards({ totalLimit, categoryCount }: SettingsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <Euro className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Limite</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalLimit)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <ShieldCheck className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Categorias</p>
        <p className="mt-1 text-sm font-bold text-white">{categoryCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <BellRing className="h-4 w-4 text-[#f7b84b]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Moeda</p>
        <p className="mt-1 text-sm font-bold text-white">EUR</p>
      </div>
    </section>
  );
}
