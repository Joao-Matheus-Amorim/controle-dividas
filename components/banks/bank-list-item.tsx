import { BankAccountEditDialog } from "@/components/finance/bank-account-edit-dialog";
import { Badge } from "@/components/ui/badge";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { Banknote } from "lucide-react";
import { BankBalanceForm } from "./bank-balance-form";
import { BankDeleteForm } from "./bank-delete-form";
import { compactCurrencyForCode } from "./bank-utils";

interface BankListItemProps {
  account: DbBankAccount;
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
}

export function BankListItem({ account, members, canEdit, canDelete }: BankListItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Banknote className="h-5 w-5" /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{account.bank_name}</p>
            <Badge variant="outline" className="border-border text-muted-foreground">{account.currency}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-ff-subtle-foreground">{account.family_members?.name || "Sem pessoa vinculada"} · {account.account_type || "Tipo não informado"}</p>
          {account.notes ? <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">{account.notes}</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-ff-bg-soft px-3 py-2 md:min-w-40 md:text-right">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">Saldo manual</p>
        <p className="mt-1 text-sm font-bold text-ff-success">{compactCurrencyForCode(Number(account.current_balance), account.currency)}</p>
      </div>

      {(canEdit || canDelete) ? (
        <div className="flex items-start justify-between gap-3 md:justify-end">
          {canEdit ? (
            <>
              <BankAccountEditDialog account={account} members={members} />
              <BankBalanceForm account={account} />
            </>
          ) : null}
          {canDelete ? <BankDeleteForm accountId={account.id} /> : null}
        </div>
      ) : null}
    </div>
  );
}
