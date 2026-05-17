import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DbPayableBill } from "@/lib/finance/types";
import { compactCurrency, formatDate } from "./report-utils";

type PendingBill = DbPayableBill & { computed_status: string };

interface ReportPendingBillsProps {
  bills: PendingBill[];
}

export function ReportPendingBills({ bills }: ReportPendingBillsProps) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Contas pendentes</p>
        <AlertTriangle className="h-4 w-4 text-white/30" />
      </div>
      {bills.length === 0 ? (
        <p className="text-sm text-white/35">Nenhuma conta pendente ou atrasada.</p>
      ) : (
        bills.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                <Badge variant={bill.computed_status === "atrasado" ? "destructive" : "outline"}>{bill.computed_status}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-white/35">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
              <p className="mt-0.5 text-xs text-white/25">Vence em {formatDate(bill.due_date)}</p>
            </div>
            <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
          </div>
        ))
      )}
    </div>
  );
}