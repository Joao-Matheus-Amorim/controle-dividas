import { compactCurrency } from "./payable-utils";

interface PayableHeroSummaryProps {
  totalPending: number;
  totalOverdue: number;
  pendingCount: number;
  overdueCount: number;
}

export function PayableHeroSummary({
  totalPending,
  totalOverdue,
  pendingCount,
  overdueCount,
}: PayableHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f7b84b]/20 bg-[linear-gradient(135deg,#2a1a08_0%,#140c05_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f7b84b]/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total em aberto</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {compactCurrency(totalPending + totalOverdue)}
        </p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Pendentes</p>
            <p className="mt-1 text-sm font-semibold text-[#f7b84b]">{pendingCount} · {compactCurrency(totalPending)}</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Atrasadas</p>
            <p className="mt-1 text-sm font-semibold text-[#f0506e]">{overdueCount} · {compactCurrency(totalOverdue)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
