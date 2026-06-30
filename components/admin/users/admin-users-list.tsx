import type { DbProfile } from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";
import { AdminUsersListItem } from "./admin-users-list-item";

interface AdminUsersListProps {
  profiles: DbProfile[];
  adminProfileId: string;
  members: DbFamilyMember[];
}

export function AdminUsersList({ profiles, adminProfileId, members }: AdminUsersListProps) {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Acessos cadastrados</p>
        <p className="text-xs font-semibold text-primary">{profiles.length}</p>
      </div>

      {profiles.map((profile) => (
        <AdminUsersListItem
          key={profile.id}
          profile={profile}
          adminProfileId={adminProfileId}
          members={members}
        />
      ))}
    </section>
  );
}