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
import { MovementReversalForm } from "./movement-reversal-form";

interface MovementListProps {
  movements: DbFinancialMovement[];
}

export function MovementList({ movements }: MovementListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">
            Lancamentos
          </p>
          <p className="mt-1 text-sm text-ff-subtle-foreground">
            Historico gerado por pagamentos e recebimentos.
          </p>
        </div>
        <p className="text-xs font-semibold text-primary">{movements.length}</p>
      </div>

      {movements.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background/45 p-4 text-sm text-ff-subtle-foreground">
          Nenhuma movimentacao registrada ainda.
        </div>
      ) : (
        <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-border bg-background/45">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="grid gap-3 p-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {movementTitle(movement)}
                  </p>
                  <Badge variant={movement.direction === "inflow" ? "secondary" : "destructive"}>
                    {movementTypeLabel(movement)}
                  </Badge>
                  {movement.reversed_at ? (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      estornado
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs text-ff-subtle-foreground">
                  {movement.family_members?.name ?? "Sem pessoa"} - {movementBankLabel(movement)}
                </p>
                <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">
                  {movementReferenceLabel(movement)}
                </p>
              </div>

              <div className="min-w-0 text-xs text-ff-subtle-foreground">
                <p>{movementDateTime(movement)}</p>
                {movement.recorded_timezone ? (
                  <p className="mt-0.5 truncate text-ff-subtle-foreground">{movement.recorded_timezone}</p>
                ) : null}
                {movement.reversed_at ? (
                  <p className="mt-0.5 truncate text-ff-destructive">
                    Estornado em {movementDateTime({ ...movement, occurred_at: movement.reversed_at })}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-start gap-2 md:items-end">
                <p className={movement.reversed_at
                  ? "text-sm font-bold text-ff-subtle-foreground line-through"
                  : movement.direction === "inflow"
                    ? "text-sm font-bold text-ff-success"
                    : "text-sm font-bold text-ff-destructive"}
                >
                  {movementAmount(movement)}
                </p>
                {!movement.reversed_at && (
                  movement.movement_type === "payable_bill_payment" ||
                  movement.movement_type === "receivable_income_receipt"
                ) ? (
                  <MovementReversalForm movementId={movement.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
