import { PayableBillDeleteDialog } from "@/components/finance/payable-bill-delete-dialog";
import { PayableBillEditDialog } from "@/components/finance/payable-bill-edit-dialog";
import { PayableBillStatusForm } from "@/components/finance/payable-bill-status-form";
import { Badge } from "@/components/ui/badge";
import type {
  DbBankAccount,
  DbExpenseCategory,
  DbFamilyMember,
  DbPayableBill,
} from "@/lib/finance/types";
import { compactCurrency, statusVariant } from "./payable-utils";

type PayableListBill = DbPayableBill & { computed_status: string };

interface PayableListItemProps {
  bill: PayableListBill;
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts: DbBankAccount[];
  canEdit: boolean;
  canDelete: boolean;
}

export function PayableListItem({
  bill,
  members,
  categories,
  bankAccounts,
  canEdit,
  canDelete,
}: PayableListItemProps) {
  const reversedAtLabel = bill.last_reversed_movement?.reversed_at
    ? new Date(bill.last_reversed_movement.reversed_at).toLocaleDateString("pt-BR")
    : null;
  const reversedBankLabel = bill.last_reversed_movement?.bank_name
    ? ` - ${bill.last_reversed_movement.bank_name}`
    : "";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{bill.name}</p>
          <Badge variant={bill.bill_type === "fixa" ? "secondary" : "outline"}>
            {bill.bill_type === "fixa" ? "fixa" : "avulsa"}
          </Badge>
          <Badge variant={statusVariant(bill.computed_status)}>{bill.computed_status}</Badge>
          {bill.last_reversed_movement ? (
            <Badge variant="outline" className="border-amber-300/30 bg-amber-300/10 text-amber-100">
              Pagamento estornado
            </Badge>
          ) : null}
          {bill.recurrence ? (
            <Badge variant="outline" className="border-border text-muted-foreground">{bill.recurrence}</Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-ff-subtle-foreground">
          {bill.category || "Sem categoria"} - {bill.family_members?.name || "Sem responsavel"}
        </p>
        {reversedAtLabel ? (
          <p className="mt-0.5 truncate text-xs text-amber-100/70">
            Ultimo estorno: {reversedAtLabel}{reversedBankLabel}
          </p>
        ) : null}
        <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">
          Vencimento: {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString("pt-BR")}
          {bill.bank_used ? ` - ${bill.bank_used}` : ""}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <p className="text-sm font-bold text-foreground">{compactCurrency(Number(bill.amount))}</p>
        {canEdit ? (
          <>
            <PayableBillEditDialog
              bill={bill}
              members={members}
              categories={categories}
              bankAccounts={bankAccounts}
            />
            <PayableBillStatusForm bill={bill} bankAccounts={bankAccounts} />
          </>
        ) : null}
        {canDelete ? <PayableBillDeleteDialog bill={bill} /> : null}
      </div>
    </div>
  );
}
