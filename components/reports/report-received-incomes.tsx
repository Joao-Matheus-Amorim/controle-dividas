import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DbReceivableIncome } from "@/lib/finance/types";
import { compactCurrency, formatDate } from "./report-utils";

type ReceivedIncome = DbReceivableIncome & { computed_status: string };

interface ReportReceivedIncomesProps {
  incomes: ReceivedIncome[];
}

export function ReportReceivedIncomes({ incomes }: ReportReceivedIncomesProps) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Rendas recebidas</p>
        <CheckCircle2 className="h-4 w-4 text-white/30" />
      </div>
      {incomes.length === 0 ? (
        <p className="text-sm text-white/35">Nenhuma renda recebida cadastrada.</p>
      ) : (
        incomes.map((income) => (
          <div key={income.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                <Badge variant="secondary">recebido</Badge>
                <Badge variant="outline" className="border-white/10 text-white/50">{income.income_type}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa"} · {income.receiving_bank || "Sem banco"}</p>
              <p className="mt-0.5 text-xs text-white/25">Data: {formatDate(income.expected_date)}</p>
            </div>
            <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
          </div>
        ))
      )}
    </div>
  );
}