import Link from "next/link";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { compactCurrency, initials } from "./dashboard-utils";

type MemberSummary = {
  id: string;
  name: string;
  monthly_limit: number;
  spent: number;
  remaining: number;
  usedPercent: number;
};

interface DashboardFamilySummaryProps {
  canExpenses: boolean;
  canPeople: boolean;
  members: MemberSummary[];
}

export function DashboardFamilySummary({ canExpenses, canPeople, members }: DashboardFamilySummaryProps) {
  if (!canExpenses || members.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppSectionTitle>Família</AppSectionTitle>
          <p className="mt-1 text-sm text-white/35">Membros dentro do seu escopo</p>
        </div>
        {canPeople ? <Link href="/protected/pessoas" className="text-xs font-semibold text-[#8b72f8]">ver todos</Link> : null}
      </div>

      <AppCard className="space-y-2">
        {members.map((member) => {
          const memberUsedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
          const exceeded = member.remaining < 0;

          return (
            <div key={member.id} className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                  {initials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                    <p className={exceeded ? "shrink-0 text-sm font-bold text-[#f0506e]" : "shrink-0 text-sm font-bold text-[#1de9b2]"}>{compactCurrency(member.remaining)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={exceeded ? "h-full rounded-full bg-[#f0506e]" : "h-full rounded-full bg-[#8b72f8]"} style={{ width: memberUsedPercent + "%" }} />
                  </div>
                  <p className="mt-1 text-xs text-white/30">
                    {compactCurrency(member.spent)} usados de {compactCurrency(Number(member.monthly_limit))}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </AppCard>
    </section>
  );
}
