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
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Saldo por pessoa</p>
        <p className="text-xs font-semibold text-[#8b72f8]">membros</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {members.map((member) => (
          <div key={member.id} className="min-w-[118px] rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5caaff]/15 text-xs font-bold text-[#5caaff]">{initials(member.name)}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                <p className="text-xs text-white/35">{member.accounts.length} conta(s)</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-[#1de9b2]">{compactCurrency(member.totalBalance)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
