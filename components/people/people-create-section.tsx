import { FamilyMemberFormDialog } from "@/components/finance/family-member-form-dialog";

export function PeopleCreateSection() {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova pessoa</p>
          <p className="mt-1 text-sm text-white/40">Crie o membro da família e depois vincule o acesso na área Admin.</p>
        </div>
        <FamilyMemberFormDialog />
      </div>
    </section>
  );
}
