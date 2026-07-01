import { FamilyUserFormDialog } from "@/components/finance/family-user-form-dialog";
import type { DbFamilyMember } from "@/lib/finance/types";

interface AdminUsersCreateSectionProps {
  members: DbFamilyMember[];
  memberCreateHref: string;
}

export function AdminUsersCreateSection({ members, memberCreateHref }: AdminUsersCreateSectionProps) {
  return (
    <section className="rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Novo acesso</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie um login vinculado a um membro da família.</p>
        </div>
        <FamilyUserFormDialog members={members} memberCreateHref={memberCreateHref} />
      </div>
    </section>
  );
}
