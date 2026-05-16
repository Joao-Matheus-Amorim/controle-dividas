import { compactCurrency } from "./people-utils";

interface PeopleHeroSummaryProps {
  totalLimit: number;
  activeCount: number;
  accessCount: number;
}

export function PeopleHeroSummary({ totalLimit, activeCount, accessCount }: PeopleHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Limite familiar</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {compactCurrency(totalLimit)}
        </p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Ativos</p>
            <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{activeCount} membro(s)</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Com acesso</p>
            <p className="mt-1 text-sm font-semibold text-white/85">{accessCount} login(s)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
