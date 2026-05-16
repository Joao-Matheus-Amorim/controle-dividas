import { compactCurrency } from "./bank-utils";

interface BankHeroSummaryProps {
  totalBalance: number;
  totalAccounts: number;
  memberCount: number;
}

export function BankHeroSummary({ totalBalance, totalAccounts, memberCount }: BankHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#5caaff]/20 bg-[linear-gradient(135deg,#07172e_0%,#061020_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#5caaff]/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Saldo total em bancos</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{compactCurrency(totalBalance)}</p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Contas</p>
            <p className="mt-1 text-sm font-semibold text-[#5caaff]">{totalAccounts} cadastrada(s)</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Membros</p>
            <p className="mt-1 text-sm font-semibold text-white/85">{memberCount} pessoa(s)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
