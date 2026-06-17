import { Badge } from "@/components/ui/badge";
import type { DbFinancialMovement } from "@/lib/finance/types";
import {
  movementAmount,
  movementBankLabel,
  movementDateTime,
  movementReferenceLabel,
  movementTitle,
  movementTypeLabel,
} from "./movement-utils";

interface MovementListProps {
  movements: DbFinancialMovement[];
}

export function MovementList({ movements }: MovementListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">
            Lancamentos
          </p>
          <p className="mt-1 text-sm text-white/35">
            Historico gerado por pagamentos e recebimentos.
          </p>
        </div>
        <p className="text-xs font-semibold text-[#8b72f8]">{movements.length}</p>
      </div>

      {movements.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-4 text-sm text-white/35">
          Nenhuma movimentacao registrada ainda.
        </div>
      ) : (
        <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#080810]/45">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="grid gap-3 p-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {movementTitle(movement)}
                  </p>
                  <Badge variant={movement.direction === "inflow" ? "secondary" : "destructive"}>
                    {movementTypeLabel(movement)}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-white/35">
                  {movement.family_members?.name ?? "Sem pessoa"} - {movementBankLabel(movement)}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/25">
                  {movementReferenceLabel(movement)}
                </p>
              </div>

              <div className="min-w-0 text-xs text-white/35">
                <p>{movementDateTime(movement)}</p>
                {movement.recorded_timezone ? (
                  <p className="mt-0.5 truncate text-white/25">{movement.recorded_timezone}</p>
                ) : null}
              </div>

              <p className={movement.direction === "inflow"
                ? "text-sm font-bold text-[#1de9b2]"
                : "text-sm font-bold text-ff-destructive"}
              >
                {movementAmount(movement)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
