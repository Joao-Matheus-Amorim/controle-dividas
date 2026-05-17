import { deleteBankAccount, updateBankAccountBalance } from "@/app/protected/bancos/actions";
import { BankAccountEditDialog } from "@/components/finance/bank-account-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { Banknote, Trash2 } from "lucide-react";

interface BankListItemProps {
  account: DbBankAccount;
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
}

export function BankListItem({ account, members, canEdit, canDelete }: BankListItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5caaff]/10 text-[#5caaff]"><Banknote className="h-5 w-5" /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">{account.bank_name}</p>
            <Badge variant="outline" className="border-white/10 text-white/50">{account.currency}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-white/35">{account.family_members?.name || "Sem pessoa vinculada"} · {account.account_type || "Tipo não informado"}</p>
          {account.notes ? <p className="mt-0.5 truncate text-xs text-white/25">{account.notes}</p> : null}
        </div>
      </div>

      {(canEdit || canDelete) ? (
        <div className="flex items-center justify-between gap-3 md:justify-end">
          {canEdit ? (
            <>
              <BankAccountEditDialog account={account} members={members} />
              <form action={updateBankAccountBalance} className="flex gap-2">
                <input type="hidden" name="id" value={account.id} />
                <Input name="current_balance" type="number" step="0.01" defaultValue={Number(account.current_balance)} className="h-9 w-28 rounded-xl border-white/10 bg-[#080810] text-xs text-white" />
                <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">Salvar</Button>
              </form>
            </>
          ) : null}
          {canDelete ? (
            <form action={deleteBankAccount}>
              <input type="hidden" name="id" value={account.id} />
              <Button type="submit" variant="outline" size="icon" aria-label="Excluir banco" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
