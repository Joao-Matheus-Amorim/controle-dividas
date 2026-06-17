import type { DbBankAccount, DbFamilyMember, DbReceivableIncome } from "@/lib/finance/types";
import { ReceivableListItem } from "./receivable-list-item";

type ReceivableListIncome = DbReceivableIncome & { computed_status: string };

interface ReceivableListProps {
  incomes: ReceivableListIncome[];
  members: DbFamilyMember[];
  bankAccounts: DbBankAccount[];
  canEdit: boolean;
  canDelete: boolean;
}

export function ReceivableList({ incomes, members, bankAccounts, canEdit, canDelete }: ReceivableListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Recebimentos</p>
        <p className="text-xs font-semibold text-[#8b72f8]">{incomes.length}</p>
      </div>

      {incomes.length === 0 ? (
        <p className="text-sm text-white/35">Nenhuma conta a receber cadastrada ainda.</p>
      ) : (
        incomes.map((income) => (
          <ReceivableListItem
            key={income.id}
            income={income}
            members={members}
            bankAccounts={bankAccounts}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))
      )}
    </section>
  );
}
