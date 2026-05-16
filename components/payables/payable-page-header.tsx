import { WalletCards } from "lucide-react";

interface PayablePageHeaderProps {
  periodLabel: string;
}

export function PayablePageHeader({ periodLabel }: PayablePageHeaderProps) {
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">{periodLabel}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Contas e dividas</h1>
        <p className="mt-1 text-sm text-white/40">Contas fixas, avulsas, pagamentos e vencimentos</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#f7b84b]">
        <WalletCards className="h-5 w-5" />
      </div>
    </section>
  );
}
