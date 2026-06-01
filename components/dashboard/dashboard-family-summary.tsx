import Link from "next/link";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
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
  orgSlug?: string;
}

export function DashboardFamilySummary({ canExpenses, canPeople, members, orgSlug }: DashboardFamilySummaryProps) {
  if (!canExpenses || members.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppSectionTitle>Família</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Membros dentro do seu escopo</p>
        </div>
        {canPeople ? (
          <Link
            href={getOrgPathFromProtectedPath("/protected/pessoas", orgSlug)}
            className="text-xs font-semibold text-primary hover:text-ff-primary-hover"
          >
            ver todos
          </Link>
        ) : null}
      </div>

      <AppCard className="space-y-2">
        {members.map((member) => {
          const memberUsedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
          const exceeded = member.remaining < 0;

          return (
            <div key={member.id} className="rounded-ff-md border border-border bg-ff-bg-soft p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ff-primary-soft text-xs font-bold text-primary">
                  {initials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <p className={exceeded ? "shrink-0 text-sm font-bold text-ff-destructive" : "shrink-0 text-sm font-bold text-ff-success"}>{compactCurrency(member.remaining)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={exceeded ? "h-full rounded-full bg-ff-destructive" : "h-full rounded-full bg-primary"} style={{ width: memberUsedPercent + "%" }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
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
