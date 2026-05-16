import { BankAccountFormDialog } from "@/components/finance/bank-account-form-dialog";
import type { DbFamilyMember } from "@/lib/finance/server";

interface BankCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
}

export function BankCreateSection({ canCreate, members }: BankCreateSectionProps) {
  if (!canCreate) return null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo banco</p>
          <p className="mt-1 text-sm text-white/40">Cadastre contas e saldos sem poluir a tela principal.</p>
        </div>
        <BankAccountFormDialog members={members} />
      </div>
    </section>
  );
}
