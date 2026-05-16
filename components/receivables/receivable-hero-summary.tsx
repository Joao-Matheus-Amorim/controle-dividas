import { compactCurrency } from "./receivable-utils";

interface ReceivableHeroSummaryProps {
  totalExpected: number;
  totalOverdue: number;
  totalReceived: number;
  receivedCount: number;
  overdueCount: number;
}

export function ReceivableHeroSummary({
  totalExpected,
  totalOverdue,
  totalReceived,
  receivedCount,
  overdueCount,
}: ReceivableHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#1de9b2]/20 bg-[linear-gradient(135deg,#071e18_0%,#03110d_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#1de9b2]/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total previsto</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {compactCurrency(totalExpected + totalOverdue)}
        </p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Recebido</p>
            <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{receivedCount} · {compactCurrency(totalReceived)}</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Atrasado</p>
            <p className="mt-1 text-sm font-semibold text-[#f0506e]">{overdueCount} · {compactCurrency(totalOverdue)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
