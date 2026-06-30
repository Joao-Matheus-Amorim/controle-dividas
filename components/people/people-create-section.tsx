import { FamilyMemberFormDialog } from "@/components/finance/family-member-form-dialog";

interface PeopleCreateSectionProps {
  canManagePeople?: boolean;
}

export function PeopleCreateSection({ canManagePeople = false }: PeopleCreateSectionProps) {
  if (!canManagePeople) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Nova pessoa</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie o membro da família e depois vincule o acesso na área Admin.</p>
        </div>
        <FamilyMemberFormDialog />
      </div>
    </section>
  );
}
