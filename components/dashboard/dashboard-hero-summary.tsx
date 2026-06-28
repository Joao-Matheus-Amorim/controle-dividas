interface DashboardHeroSummaryProps {
  hasCashflowView: boolean;
  visibleModuleCount: number;
  totalExpensesLabel: string;
  totalOpenDebtsLabel: string;
  totalReceivableIncomesLabel: string;
  projectedNetFlowLabel: string;
  monthlyFlowLabel: string;
  displayCurrency: string;
  positiveProjectedNetFlow: boolean;
  canPayables: boolean;
  canReceivables: boolean;
}

export function DashboardHeroSummary({
  hasCashflowView,
  visibleModuleCount,
  totalExpensesLabel,
  totalOpenDebtsLabel,
  totalReceivableIncomesLabel,
  projectedNetFlowLabel,
  monthlyFlowLabel,
  displayCurrency,
  positiveProjectedNetFlow,
  canPayables,
  canReceivables,
}: DashboardHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-border bg-card p-4 shadow-ff-md sm:p-5">
      <div aria-hidden className="app-hero-glow pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-border bg-ff-bg-soft/40" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ff-subtle-foreground">
              {hasCashflowView ? "Entradas x saídas" : "Resumo liberado"}
            </p>
            <p className="mt-1 truncate text-3xl font-black text-foreground md:text-5xl">
              {hasCashflowView ? projectedNetFlowLabel : `${visibleModuleCount} módulos`}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasCashflowView
                ? `Relação do mês em ${displayCurrency}: ${monthlyFlowLabel}.`
                : "Resumo dos módulos liberados para este acesso."}
            </p>
          </div>
          {hasCashflowView ? (
            <div
              className={
                positiveProjectedNetFlow
                  ? "shrink-0 rounded-full border border-ff-success/20 bg-ff-success-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ff-success"
                  : "shrink-0 rounded-full border border-ff-destructive/20 bg-ff-destructive-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ff-destructive"
              }
            >
              {positiveProjectedNetFlow ? "fôlego" : "atenção"}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Entradas</p>
            <p className="mt-1 truncate text-sm font-black text-ff-success">
              {totalReceivableIncomesLabel}
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Saídas</p>
            <p className="mt-1 truncate text-sm font-black text-foreground">
              {totalExpensesLabel}
            </p>
          </div>
          {canPayables ? (
            <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">Em aberto</p>
              <p className="mt-1 truncate text-sm font-black text-ff-warning">
                {totalOpenDebtsLabel}
              </p>
            </div>
          ) : null}
          {canReceivables || hasCashflowView ? (
            <div className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ff-subtle-foreground">
                Saldo projetado
              </p>
              <p
                className={
                  positiveProjectedNetFlow
                    ? "mt-1 truncate text-sm font-black text-ff-success"
                    : "mt-1 truncate text-sm font-black text-ff-destructive"
                }
              >
                {projectedNetFlowLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
