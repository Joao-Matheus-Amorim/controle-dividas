import type { DbBankAccount, DbFamilyMember } from "@/lib/finance/types";
import { compactCurrency, initials } from "./bank-utils";

type AccountByMember = DbFamilyMember & {
  accounts: DbBankAccount[];
  totalBalance: number;
};

interface BankMemberBalancesProps {
  members: AccountByMember[];
}

export function BankMemberBalances({ members }: BankMemberBalancesProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Saldo por pessoa</p>
        <p className="text-xs font-semibold text-primary">membros</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="min-w-0 rounded-2xl border border-border bg-ff-bg-soft p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials(member.name)}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                <p className="text-xs text-ff-subtle-foreground">{member.accounts.length} conta(s)</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-ff-success">{compactCurrency(member.totalBalance)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
