import { PayableBillFormDialog } from "@/components/finance/payable-bill-form-dialog";
import type { DbFamilyMember } from "@/lib/finance/types";

interface PayableCreateSectionProps {
  canCreate: boolean;
  members: DbFamilyMember[];
}

export function PayableCreateSection({ canCreate, members }: PayableCreateSectionProps) {
  if (!canCreate) return null;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova conta/divida</p>
          <p className="mt-1 text-sm text-white/40">Cadastre uma conta avulsa ou uma conta fixa mensal.</p>
        </div>
        <PayableBillFormDialog members={members} />
      </div>
    </section>
  );
}
