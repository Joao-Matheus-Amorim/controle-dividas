import { ReceivableIncomeEditDialog } from "@/components/finance/receivable-income-edit-dialog";
import { Badge } from "@/components/ui/badge";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbReceivableIncome,
  DbReceivableIncomeSource,
} from "@/lib/finance/types";
import { ReceivableDeleteForm } from "./receivable-delete-form";
import { ReceivableStatusForm } from "./receivable-status-form";
import { compactCurrency, statusVariant } from "./receivable-utils";

type ReceivableListIncome = DbReceivableIncome & { computed_status: string };

interface ReceivableListItemProps {
  income: ReceivableListIncome;
  members: DbFamilyMember[];
  sources: DbReceivableIncomeSource[];
  bankAccounts: DbBankAccount[];
  canEdit: boolean;
  canDelete: boolean;
}

export function ReceivableListItem({
  income,
  members,
  sources,
  bankAccounts,
  canEdit,
  canDelete,
}: ReceivableListItemProps) {
  const reversedAtLabel = income.last_reversed_movement?.reversed_at
    ? new Date(income.last_reversed_movement.reversed_at).toLocaleDateString("pt-BR")
    : null;
  const reversedBankLabel = income.last_reversed_movement?.bank_name
    ? ` - ${income.last_reversed_movement.bank_name}`
    : "";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{income.source}</p>
          <Badge variant={statusVariant(income.computed_status)}>{income.computed_status}</Badge>
          {income.last_reversed_movement ? (
            <Badge variant="outline" className="border-amber-300/30 bg-amber-300/10 text-amber-100">
              Recebimento estornado
            </Badge>
          ) : null}
          <Badge variant="outline" className="border-white/10 text-white/50">renda {income.income_type}</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-white/35">
          {income.family_members?.name || "Sem pessoa vinculada"}
        </p>
        {income.payment_origin ? (
          <p className="mt-0.5 truncate text-xs text-white/30">Origem do pagamento: {income.payment_origin}</p>
        ) : null}
        {reversedAtLabel ? (
          <p className="mt-0.5 truncate text-xs text-amber-100/70">
            Ultimo estorno: {reversedAtLabel}{reversedBankLabel}
          </p>
        ) : null}
        <p className="mt-0.5 truncate text-xs text-white/25">
          Data prevista: {new Date(`${income.expected_date}T00:00:00`).toLocaleDateString("pt-BR")}
          {income.receiving_bank ? ` - ${income.receiving_bank}` : ""}
        </p>
      </div>

      <div className="flex items-start justify-between gap-3 md:justify-end">
        <p className="pt-2 text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
        {canEdit ? (
          <>
            <ReceivableIncomeEditDialog
              income={income}
              members={members}
              sources={sources}
              bankAccounts={bankAccounts}
            />
            <ReceivableStatusForm income={income} bankAccounts={bankAccounts} />
          </>
        ) : null}
        {canDelete ? <ReceivableDeleteForm incomeId={income.id} /> : null}
      </div>
    </div>
  );
}
