import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

interface DashboardHeaderProps {
  periodContextLabel: string;
  orgName?: string;
  isLimitedDashboard: boolean;
  canAdmin: boolean;
  orgSlug?: string;
}

export function DashboardHeader({
  periodContextLabel,
  orgName,
  isLimitedDashboard,
  canAdmin,
  orgSlug,
}: DashboardHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          {orgName ? (
            <>
              <span className="text-foreground">{orgName}</span>
              <span aria-hidden> · </span>
            </>
          ) : null}
          {periodContextLabel}
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground md:text-4xl">
          Visão do mês
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLimitedDashboard ? "Visão limitada por permissão." : "Resumo financeiro familiar."}
        </p>
      </div>
      {canAdmin ? (
        <Link
          href={getOrgPathFromProtectedPath("/protected/admin", orgSlug)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-ff-sm transition active:scale-[0.96] hover:border-primary/40"
          aria-label="Abrir admin"
        >
          <ShieldCheck className="h-5 w-5" />
        </Link>
      ) : null}
    </section>
  );
}

export function DashboardLimitedNotice() {
  return (
    <section className="rounded-ff-2xl border border-primary/20 bg-ff-primary-soft p-4 text-sm text-primary">
      Visão limitada pelo Admin. Menus, dados e ações aparecem conforme suas permissões.
    </section>
  );
}
