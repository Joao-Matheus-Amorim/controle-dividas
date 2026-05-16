import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";

interface AdminPermissionsSummaryCardsProps {
  familyUserCount: number;
  permissionCount: number;
  moduleCount: number;
}

export function AdminPermissionsSummaryCards({
  familyUserCount,
  permissionCount,
  moduleCount,
}: AdminPermissionsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <UsersRound className="h-4 w-4 text-[#5caaff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Usuários</p>
        <p className="mt-1 text-sm font-bold text-white">{familyUserCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <KeyRound className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Regras</p>
        <p className="mt-1 text-sm font-bold text-white">{permissionCount}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <ShieldCheck className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Módulos</p>
        <p className="mt-1 text-sm font-bold text-white">{moduleCount}</p>
      </div>
    </section>
  );
}
