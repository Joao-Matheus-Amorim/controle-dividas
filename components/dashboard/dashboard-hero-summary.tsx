import { compactCurrency } from "./dashboard-utils";

interface DashboardHeroSummaryProps {
  canExpenses: boolean;
  visibleModuleCount: number;
  remainingMonthlyLimit: number;
  totalMonthlyLimit: number;
  totalExpenses: number;
  totalOpenDebts: number;
  totalReceivableIncomes: number;
  usedPercent: number;
  healthyMonth: boolean;
  canPayables: boolean;
  canReceivables: boolean;
}

export function DashboardHeroSummary({
  canExpenses,
  visibleModuleCount,
  remainingMonthlyLimit,
  totalMonthlyLimit,
  totalExpenses,
  totalOpenDebts,
  totalReceivableIncomes,
  usedPercent,
  healthyMonth,
  canPayables,
  canReceivables,
}: DashboardHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-border bg-card p-4 shadow-ff-md sm:p-5">
      {/* Profundidade cinematográfica governada — ver .app-hero-glow em globals.css */}
      <div aria-hidden className="app-hero-glow pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-border bg-ff-bg-soft/40" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ff-subtle-foreground">
              {canExpenses ? "Saldo do mês" : "Resumo liberado"}
            </p>
            <p className="mt-1 truncate text-3xl font-black text-foreground md:text-5xl">
              {canExpenses ? compactCurrency(remainingMonthlyLimit) : `${visibleModuleCount} módulos`}
            </p>
          </div>
          {canExpenses ? (
            <div className={healthyMonth ? "shrink-0 rounded-full border border-ff-success/20 bg-ff-success-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ff-success" : "shrink-0 rounded-full border border-ff-destructive/20 bg-ff-destructive-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ff-destructive"}>
              {healthyMonth ? "ok" : "atenção"}
            </div>
          ) : null}
        </div>

        {canExpenses ? (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={healthyMonth ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-ff-destructive"}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {canExpenses ? (
            <>
              <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Gasto</p>
                <p className="mt-1 truncate text-sm font-black text-foreground">{compactCurrency(totalExpenses)}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Limite</p>
                <p className="mt-1 truncate text-sm font-black text-foreground">{compactCurrency(totalMonthlyLimit)}</p>
              </div>
            </>
          ) : null}
          {canPayables ? (
            <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Dívidas</p>
              <p className="mt-1 truncate text-sm font-black text-ff-warning">{compactCurrency(totalOpenDebts)}</p>
            </div>
          ) : null}
          {canReceivables ? (
            <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Receber</p>
              <p className="mt-1 truncate text-sm font-black text-ff-success">{compactCurrency(totalReceivableIncomes)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
