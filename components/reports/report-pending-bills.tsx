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
    <div className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Contas pendentes</p>
        <AlertTriangle className="h-4 w-4 text-ff-subtle-foreground" />
      </div>
      {bills.length === 0 ? (
        <p className="text-sm text-ff-subtle-foreground">Nenhuma conta pendente ou atrasada.</p>
      ) : (
        bills.map((bill) => (
          <div key={bill.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/50 p-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{bill.name}</p>
                <Badge variant={bill.computed_status === "atrasado" ? "destructive" : "outline"}>{bill.computed_status}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-ff-subtle-foreground">
                {bill.category || "Sem categoria"} - {bill.family_members?.name || "Sem responsavel"}
              </p>
              <p className="mt-0.5 text-xs text-ff-subtle-foreground">Vence em {formatDate(bill.due_date)}</p>
            </div>
            <p className="text-sm font-bold text-foreground">{compactCurrency(Number(bill.amount))}</p>
          </div>
        ))
      )}
    </div>
  );
}
