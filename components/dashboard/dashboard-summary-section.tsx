import { ReceiptText, Users, WalletCards, CalendarClock, AlertTriangle, Repeat2 } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import { DashboardSummaryCarousel } from "./dashboard-summary-carousel";
import { compactCurrency } from "./dashboard-utils";

export type DashboardSummaryRow = {
  label: string;
  detail: string;
  value: string;
  iconKey: "expenses" | "payables" | "banks" | "receivables";
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
    <section className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
      <AppCard padding="sm" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <AppSectionTitle>Resumo financeiro</AppSectionTitle>
            <p className="mt-1 text-xs text-muted-foreground">Módulos liberados</p>
          </div>
          <ReceiptText className="h-4 w-4 text-ff-subtle-foreground" />
        </div>

        <DashboardSummaryCarousel rows={rows} />
      </AppCard>

      {canPayables ? (
        <AppCard padding="sm" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <AppSectionTitle>Contas e dividas</AppSectionTitle>
              <p className="mt-1 text-xs text-muted-foreground">Pendências do mês</p>
            </div>
            <WalletCards className="h-4 w-4 text-ff-subtle-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-border bg-ff-bg-soft p-3">
              <CalendarClock className="h-4 w-4 text-ff-warning" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">Pendentes</p>
              <p className="mt-1 text-sm font-black text-foreground">{pendingCount} · {compactCurrency(totalPending)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-ff-bg-soft p-3">
              <AlertTriangle className="h-4 w-4 text-ff-destructive" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">Atrasadas</p>
              <p className="mt-1 text-sm font-black text-foreground">{overdueCount} · {compactCurrency(totalOverdue)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-ff-bg-soft p-3">
              <WalletCards className="h-4 w-4 text-primary" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">Avulsas</p>
              <p className="mt-1 text-sm font-black text-foreground">{oneOffCount} · {compactCurrency(totalOneOff)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-ff-bg-soft p-3">
              <Repeat2 className="h-4 w-4 text-primary" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ff-subtle-foreground">Fixas</p>
              <p className="mt-1 text-sm font-black text-foreground">{fixedCount} · {compactCurrency(totalFixed)}</p>
            </div>
          </div>
        </AppCard>
      ) : canExpenses ? (
        <AppCard padding="sm" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <AppSectionTitle>Uso do limite</AppSectionTitle>
              <p className="mt-1 text-sm text-muted-foreground">{usedPercent.toFixed(0)}% utilizado</p>
            </div>
            <Users className="h-4 w-4 text-ff-subtle-foreground" />
          </div>

          <div className="rounded-ff-xl border border-border bg-ff-bg-soft p-4">
            <p className="text-3xl font-black tracking-[-0.05em] text-foreground">{usedPercent.toFixed(0)}%</p>
            <p className="mt-1 text-xs text-muted-foreground">do limite permitido foi usado</p>
          </div>
        </AppCard>
      ) : null}
    </section>
  );
}
