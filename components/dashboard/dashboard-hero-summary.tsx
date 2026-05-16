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
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_85%_12%,rgba(139,114,248,0.28),transparent_34%),linear-gradient(145deg,#17112f_0%,#0b0b14_52%,#07070c_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full border border-white/10 bg-white/[0.035]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">
              {canExpenses ? "Disponível" : "Resumo liberado"}
            </p>
            <p className="mt-2 truncate text-4xl font-black tracking-[-0.06em] text-white md:text-6xl">
              {canExpenses ? compactCurrency(remainingMonthlyLimit) : `${visibleModuleCount} módulos`}
            </p>
          </div>
          {canExpenses ? (
            <div className={healthyMonth ? "shrink-0 rounded-full border border-[#1de9b2]/20 bg-[#1de9b2]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1de9b2]" : "shrink-0 rounded-full border border-[#f0506e]/20 bg-[#f0506e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0506e]"}>
              {healthyMonth ? "saudável" : "atenção"}
            </div>
          ) : null}
        </div>

        {canExpenses ? (
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={healthyMonth ? "h-full rounded-full bg-[#8b72f8]" : "h-full rounded-full bg-[#f0506e]"}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {canExpenses ? (
            <>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Gasto</p>
                <p className="mt-1 truncate text-sm font-bold text-white">{compactCurrency(totalExpenses)}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Limite</p>
                <p className="mt-1 truncate text-sm font-bold text-white">{compactCurrency(totalMonthlyLimit)}</p>
              </div>
            </>
          ) : null}
          {canPayables ? (
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Dividas</p>
              <p className="mt-1 truncate text-sm font-bold text-[#f7b84b]">{compactCurrency(totalOpenDebts)}</p>
            </div>
          ) : null}
          {canReceivables ? (
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.055] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Receber</p>
              <p className="mt-1 truncate text-sm font-bold text-[#1de9b2]">{compactCurrency(totalReceivableIncomes)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
