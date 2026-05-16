import type { LucideIcon } from "lucide-react";
import { ReceiptText, Users, WalletCards, CalendarClock, AlertTriangle, Repeat2 } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { compactCurrency } from "./dashboard-utils";

export type DashboardSummaryRow = {
  label: string;
  detail: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

interface DashboardSummarySectionProps {
  rows: DashboardSummaryRow[];
  canPayables: boolean;
  canExpenses: boolean;
  usedPercent: number;
  pendingCount: number;
  totalPending: number;
  overdueCount: number;
  totalOverdue: number;
  oneOffCount: number;
  totalOneOff: number;
  fixedCount: number;
  totalFixed: number;
}

export function DashboardSummarySection({
  rows,
  canPayables,
  canExpenses,
  usedPercent,
  pendingCount,
  totalPending,
  overdueCount,
  totalOverdue,
  oneOffCount,
  totalOneOff,
  fixedCount,
  totalFixed,
}: DashboardSummarySectionProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
      <AppCard className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <AppSectionTitle>Resumo financeiro</AppSectionTitle>
            <p className="mt-1 text-sm text-white/35">Apenas módulos liberados</p>
          </div>
          <ReceiptText className="h-4 w-4 text-white/25" />
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${row.bg}`} style={{ color: row.color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{row.label}</p>
                    <p className="truncate text-xs text-white/30">{row.detail}</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold text-white">{row.value}</p>
              </div>
            );
          })}
        </div>
      </AppCard>

      {canPayables ? (
        <AppCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <AppSectionTitle>Contas e dividas</AppSectionTitle>
              <p className="mt-1 text-sm text-white/35">Fixas, avulsas e atrasadas</p>
            </div>
            <WalletCards className="h-4 w-4 text-white/25" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <CalendarClock className="h-4 w-4 text-[#f7b84b]" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pendentes</p>
              <p className="mt-1 text-sm font-bold text-white">{pendingCount} · {compactCurrency(totalPending)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <AlertTriangle className="h-4 w-4 text-[#f0506e]" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Atrasadas</p>
              <p className="mt-1 text-sm font-bold text-white">{overdueCount} · {compactCurrency(totalOverdue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <WalletCards className="h-4 w-4 text-[#8b72f8]" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Avulsas</p>
              <p className="mt-1 text-sm font-bold text-white">{oneOffCount} · {compactCurrency(totalOneOff)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
              <Repeat2 className="h-4 w-4 text-[#b09cff]" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Fixas</p>
              <p className="mt-1 text-sm font-bold text-white">{fixedCount} · {compactCurrency(totalFixed)}</p>
            </div>
          </div>
        </AppCard>
      ) : canExpenses ? (
        <AppCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <AppSectionTitle>Uso do limite</AppSectionTitle>
              <p className="mt-1 text-sm text-white/35">{usedPercent.toFixed(0)}% utilizado</p>
            </div>
            <Users className="h-4 w-4 text-white/25" />
          </div>

          <div className="rounded-[1.35rem] border border-white/10 bg-[#080810]/45 p-4">
            <p className="text-3xl font-black tracking-[-0.05em] text-white">{usedPercent.toFixed(0)}%</p>
            <p className="mt-1 text-xs text-white/35">do limite permitido foi usado</p>
          </div>
        </AppCard>
      ) : null}
    </section>
  );
}
