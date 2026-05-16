import { UserRoundCheck, UserRoundX, UsersRound } from "lucide-react";

interface PeopleSummaryCardsProps {
  memberCount: number;
  activeCount: number;
  missingLoginCount: number;
}

export function PeopleSummaryCards({ memberCount, activeCount, missingLoginCount }: PeopleSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <UsersRound className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Membros</p>
        <p className="mt-1 text-sm font-bold text-white">{memberCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <UserRoundCheck className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Ativos</p>
        <p className="mt-1 text-sm font-bold text-white">{activeCount}</p>
      </div>
      <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
        <UserRoundX className="h-4 w-4 text-[#f0506e]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Sem login</p>
        <p className="mt-1 text-sm font-bold text-white">{missingLoginCount}</p>
      </div>
    </section>
  );
}
