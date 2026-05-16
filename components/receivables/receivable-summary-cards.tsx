import { AlertTriangle, CheckCircle2, Clock3, Repeat, WalletCards } from "lucide-react";

import { compactCurrency } from "./receivable-utils";

interface ReceivableSummaryCardsProps {
  totalExpected: number;
  totalReceived: number;
  totalOverdue: number;
  totalFixed: number;
  totalVariable: number;
}

export function ReceivableSummaryCards({
  totalExpected,
  totalReceived,
  totalOverdue,
  totalFixed,
  totalVariable,
}: ReceivableSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2 md:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <Clock3 className="h-4 w-4 text-[#f7b84b]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Previsto</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalExpected)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <CheckCircle2 className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Recebido</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalReceived)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <AlertTriangle className="h-4 w-4 text-[#f0506e]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Atraso</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalOverdue)}</p>
      </div>
      <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
        <Repeat className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Fixa</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalFixed)}</p>
      </div>
      <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
        <WalletCards className="h-4 w-4 text-[#5caaff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Variável</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalVariable)}</p>
      </div>
    </section>
  );
}
