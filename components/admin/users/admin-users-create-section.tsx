import { FamilyUserFormDialog } from "@/components/finance/family-user-form-dialog";
import type { DbFamilyMember } from "@/lib/finance/types";

interface AdminUsersCreateSectionProps {
  members: DbFamilyMember[];
}

export function AdminUsersCreateSection({ members }: AdminUsersCreateSectionProps) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo acesso</p>
          <p className="mt-1 text-sm text-white/40">Crie um login vinculado a um membro da família.</p>
        </div>
        <FamilyUserFormDialog members={members} />
      </div>
    </section>
  );
}
