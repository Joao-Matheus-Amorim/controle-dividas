import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Repeat2,
  WalletCards,
} from "lucide-react";

import { compactCurrency } from "./payable-utils";

interface PayableSummaryCardsProps {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  totalOneOff: number;
  totalFixed: number;
  oneOffCount: number;
  fixedCount: number;
}

export function PayableSummaryCards({
  totalPending,
  totalOverdue,
  totalPaid,
  totalOneOff,
  totalFixed,
  oneOffCount,
  fixedCount,
}: PayableSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <CalendarDays className="h-4 w-4 text-[#f7b84b]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pendentes</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPending)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <AlertTriangle className="h-4 w-4 text-[#f0506e]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Atraso</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalOverdue)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <CheckCircle2 className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pagas</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPaid)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <WalletCards className="h-4 w-4 text-[#8b72f8]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Avulsas</p>
        <p className="mt-1 text-sm font-bold text-white">{oneOffCount} · {compactCurrency(totalOneOff)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <Repeat2 className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Fixas</p>
        <p className="mt-1 text-sm font-bold text-white">{fixedCount} · {compactCurrency(totalFixed)}</p>
      </div>
    </section>
  );
}
