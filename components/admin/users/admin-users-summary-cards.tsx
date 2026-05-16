import { ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";

interface AdminUsersSummaryCardsProps {
  activeProfileCount: number;
  memberCount: number;
}

export function AdminUsersSummaryCards({ activeProfileCount, memberCount }: AdminUsersSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <ShieldCheck className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Admin</p>
        <p className="mt-1 text-sm font-bold text-white">1</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <UserRoundCheck className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Ativos</p>
        <p className="mt-1 text-sm font-bold text-white">{activeProfileCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <UsersRound className="h-4 w-4 text-[#5caaff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Membros</p>
        <p className="mt-1 text-sm font-bold text-white">{memberCount}</p>
      </div>
    </section>
  );
}
