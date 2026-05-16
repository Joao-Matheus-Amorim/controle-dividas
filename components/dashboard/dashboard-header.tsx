import { ShieldCheck } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  periodContextLabel: string;
  isLimitedDashboard: boolean;
  canAdmin: boolean;
}

export function DashboardHeader({
  periodContextLabel,
  isLimitedDashboard,
  canAdmin,
}: DashboardHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/25">{periodContextLabel}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-white md:text-5xl">
          Visão do mês
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
          {isLimitedDashboard
            ? "Você está vendo apenas os módulos liberados para o seu perfil."
            : "Gastos, contas, dividas, entradas e bancos organizados em uma leitura rápida."}
        </p>
      </div>
      {canAdmin ? (
        <Link
          href="/protected/admin"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055] text-[#b09cff] shadow-[0_16px_42px_rgba(0,0,0,0.25)] transition active:scale-[0.96]"
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
    <section className="rounded-[1.5rem] border border-[#8b72f8]/20 bg-[#8b72f8]/10 p-4 text-sm text-[#b09cff]">
      Visão limitada pelo Admin. Menus, dados e ações aparecem conforme suas permissões.
    </section>
  );
}
