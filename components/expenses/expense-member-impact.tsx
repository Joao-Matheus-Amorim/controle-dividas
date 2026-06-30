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
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Impacto por pessoa</p>
        <p className="text-xs font-semibold text-primary">limites</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {members.map((member) => {
          const usedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
          const exceeded = member.remaining < 0;

          return (
            <div key={member.id} className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials(member.name)}</div>
              <p className="mt-2 truncate text-[11px] font-semibold text-foreground">{member.name}</p>
              <p className="mt-1 text-[11px] font-bold text-foreground">{compactCurrency(member.spent)}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-card">
                <div className={exceeded ? "h-full rounded-full bg-ff-destructive" : "h-full rounded-full bg-primary"} style={{ width: `${usedPercent}%` }} />
              </div>
              <p className={exceeded ? "mt-2 text-[11px] font-bold text-ff-destructive" : "mt-2 text-[11px] font-bold text-ff-success"}>{compactCurrency(member.remaining)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
