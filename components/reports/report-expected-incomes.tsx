import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DbReceivableIncome } from "@/lib/finance/types";
import { compactCurrency, formatDate } from "./report-utils";

type ExpectedIncome = DbReceivableIncome & { computed_status: string };

type ReportExpectedIncomesProps = {
  incomes: ExpectedIncome[];
};

export function ReportExpectedIncomes({ incomes }: ReportExpectedIncomesProps) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">
          Receitas previstas
        </p>
        <Clock3 className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {incomes.length === 0 ? (
        <p className="text-sm text-ff-subtle-foreground">Nenhuma receita prevista no periodo.</p>
      ) : (
        incomes.map((income) => (
          <div
            key={income.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/50 p-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{income.source}</p>
                <Badge variant={income.computed_status === "atrasado" ? "destructive" : "outline"}>
                  {income.computed_status}
                </Badge>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {income.income_type}
                </Badge>
              </div>
              <p className="mt-1 truncate text-xs text-ff-subtle-foreground">
                {income.family_members?.name || "Sem pessoa"} - {income.receiving_bank || "Sem banco"}
              </p>
              <p className="mt-0.5 text-xs text-ff-subtle-foreground">Prevista em {formatDate(income.expected_date)}</p>
            </div>
            <p className="text-sm font-bold text-foreground">{compactCurrency(Number(income.amount))}</p>
          </div>
        ))
      )}
    </div>
  );
}
