import { ShieldCheck } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  periodContextLabel: string;
  orgName?: string;
  isLimitedDashboard: boolean;
  canAdmin: boolean;
}

export function DashboardHeader({
  periodContextLabel,
  orgName,
  isLimitedDashboard,
  canAdmin,
}: DashboardHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {orgName ? (
            <>
              <span className="text-foreground">{orgName}</span>
              <span aria-hidden> · </span>
            </>
          ) : null}
          {periodContextLabel}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-foreground md:text-5xl">
          Visão do mês
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          {isLimitedDashboard
            ? "Você está vendo apenas os módulos liberados para o seu perfil."
            : "Gastos, contas, dividas, entradas e bancos organizados em uma leitura rápida."}
        </p>
      </div>
      {canAdmin ? (
        <Link
          href="/protected/admin"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ff-md border border-border bg-card text-primary shadow-ff-sm transition active:scale-[0.96] hover:border-primary/40"
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
