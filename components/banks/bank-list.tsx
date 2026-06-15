import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { BankListItem } from "./bank-list-item";

interface BankListProps {
  accounts: DbBankAccount[];
  members: DbFamilyMember[];
  canEdit: boolean;
  canDelete: boolean;
}

export function BankList({ accounts, members, canEdit, canDelete }: BankListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Bancos cadastrados</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{accounts.length}</p>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-white/35">Nenhum banco cadastrado ainda.</p>
      ) : (
        accounts.map((account) => (
          <BankListItem
            key={account.id}
            account={account}
            members={members}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </section>
  );
}
