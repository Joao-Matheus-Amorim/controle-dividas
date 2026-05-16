import { PayableBillDeleteDialog } from "@/components/finance/payable-bill-delete-dialog";
import { PayableBillEditDialog } from "@/components/finance/payable-bill-edit-dialog";
import { PayableBillStatusForm } from "@/components/finance/payable-bill-status-form";
import { Badge } from "@/components/ui/badge";
import type { DbFamilyMember, DbPayableBill } from "@/lib/finance/server";
import { compactCurrency, statusVariant } from "./payable-utils";

type PayableListBill = DbPayableBill & { computed_status: string };

interface PayableListItemProps {
  bill: PayableListBill;
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
}

export function PayableListItem({ bill, members, canEdit, canDelete }: PayableListItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
          <Badge variant={bill.bill_type === "fixa" ? "secondary" : "outline"}>
            {bill.bill_type === "fixa" ? "fixa" : "avulsa"}
          </Badge>
          <Badge variant={statusVariant(bill.computed_status)}>{bill.computed_status}</Badge>
          {bill.recurrence ? <Badge variant="outline" className="border-white/10 text-white/50">{bill.recurrence}</Badge> : null}
        </div>
        <p className="mt-1 truncate text-xs text-white/35">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
        <p className="mt-0.5 truncate text-xs text-white/25">Vencimento: {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString("pt-BR")}{bill.bank_used ? ` · ${bill.bank_used}` : ""}</p>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
        {canEdit ? (
          <>
            <PayableBillEditDialog bill={bill} members={members} />
            <PayableBillStatusForm bill={bill} />
          </>
        ) : null}
        {canDelete ? <PayableBillDeleteDialog bill={bill} /> : null}
      </div>
    </div>
  );
}
