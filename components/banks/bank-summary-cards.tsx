import { Banknote, CreditCard, Users } from "lucide-react";

import { compactCurrency } from "./bank-utils";

interface BankSummaryCardsProps {
  totalBalance: number;
  totalAccounts: number;
  memberCount: number;
}

export function BankSummaryCards({ totalBalance, totalAccounts, memberCount }: BankSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <Banknote className="h-4 w-4 text-[#5caaff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Saldo</p>
        <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalBalance)}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <CreditCard className="h-4 w-4 text-[#b09cff]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Contas</p>
        <p className="mt-1 text-sm font-bold text-white">{totalAccounts}</p>
      </div>
      <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
        <Users className="h-4 w-4 text-[#1de9b2]" />
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pessoas</p>
        <p className="mt-1 text-sm font-bold text-white">{memberCount}</p>
      </div>
    </section>
  );
}
