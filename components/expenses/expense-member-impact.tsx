import { compactCurrency, initials } from "./expense-utils";

type MemberSummary = {
  id: string;
  name: string;
  spent: number;
  remaining: number;
  usedPercent: number;
};

interface ExpenseMemberImpactProps {
  members: MemberSummary[];
}

export function ExpenseMemberImpact({ members }: ExpenseMemberImpactProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Impacto por pessoa</p>
        <p className="text-xs font-semibold text-[#8b72f8]">limites</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((member) => {
          const usedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
          const exceeded = member.remaining < 0;

          return (
            <div key={member.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">{initials(member.name)}</div>
              <p className="mt-2 truncate text-[11px] font-semibold text-white/70">{member.name}</p>
              <p className="mt-1 text-[11px] font-bold text-white">{compactCurrency(member.spent)}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className={exceeded ? "h-full rounded-full bg-[#f0506e]" : "h-full rounded-full bg-[#8b72f8]"} style={{ width: `${usedPercent}%` }} />
              </div>
              <p className={exceeded ? "mt-2 text-[11px] font-bold text-[#f0506e]" : "mt-2 text-[11px] font-bold text-[#1de9b2]"}>{compactCurrency(member.remaining)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
