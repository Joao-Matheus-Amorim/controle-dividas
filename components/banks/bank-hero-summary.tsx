interface BankHeroSummaryProps {
  totalBalanceLabel: string;
  totalAccounts: number;
  memberCount: number;
}

export function BankHeroSummary({ totalBalanceLabel, totalAccounts, memberCount }: BankHeroSummaryProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(135deg,#2a1f1a_0%,#1a1613_55%,#14110F_100%)] p-5 shadow-2xl shadow-black/30">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Saldo total em bancos</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{totalBalanceLabel}</p>
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
          <div className="pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ff-subtle-foreground">Contas</p>
            <p className="mt-1 text-sm font-semibold text-primary">{totalAccounts} cadastrada(s)</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ff-subtle-foreground">Membros</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{memberCount} pessoa(s)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
