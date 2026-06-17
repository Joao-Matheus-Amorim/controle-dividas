import { ReceivableIncomeEditDialog } from "@/components/finance/receivable-income-edit-dialog";
import { Badge } from "@/components/ui/badge";
import type { DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";
import { ReceivableDeleteForm } from "./receivable-delete-form";
import { ReceivableStatusForm } from "./receivable-status-form";
import { compactCurrency, statusVariant } from "./receivable-utils";

type ReceivableListIncome = DbReceivableIncome & { computed_status: string };

interface ReceivableListItemProps {
  income: ReceivableListIncome;
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
}

export function ReceivableListItem({ income, members, canEdit, canDelete }: ReceivableListItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{income.source}</p>
          <Badge variant={statusVariant(income.computed_status)}>{income.computed_status}</Badge>
          <Badge variant="outline" className="border-white/10 text-white/50">renda {income.income_type}</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa vinculada"}</p>
        {income.payment_origin ? (
          <p className="mt-0.5 truncate text-xs text-white/30">Origem do pagamento: {income.payment_origin}</p>
        ) : null}
        <p className="mt-0.5 truncate text-xs text-white/25">Data prevista: {new Date(`${income.expected_date}T00:00:00`).toLocaleDateString("pt-BR")}{income.receiving_bank ? ` · ${income.receiving_bank}` : ""}</p>
      </div>

      <div className="flex items-start justify-between gap-3 md:justify-end">
        <p className="pt-2 text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
        {canEdit ? (
          <>
            <ReceivableIncomeEditDialog income={income} members={members} />
            <ReceivableStatusForm income={income} />
          </>
        ) : null}
        {canDelete ? <ReceivableDeleteForm incomeId={income.id} /> : null}
      </div>
    </div>
  );
}
