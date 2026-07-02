import { Badge } from "@/components/ui/badge";
import type { DbProfile } from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";
import { AdminUserDeleteForm } from "./admin-user-delete-form";
import { AdminUserEditForm } from "./admin-user-edit-form";
import { AdminUserInvitationForm } from "./admin-user-invitation-form";
import { AdminUserStatusForm } from "./admin-user-status-form";
import { AdminUserSyncForm } from "./admin-user-sync-form";
import { initials } from "./admin-users-utils";

interface AdminUsersListItemProps {
  profile: DbProfile;
  adminProfileId: string;
  members: DbFamilyMember[];
}

export function AdminUsersListItem({ profile, adminProfileId, members }: AdminUsersListItemProps) {
  const isCurrentAdmin = profile.id === adminProfileId;
  const accessStatus = profile.auth_user_id ? "Acesso ativado" : "Aguardando primeiro acesso";

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background/50 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {profile.role === "admin" ? "AD" : initials(profile.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
              <Badge variant={profile.role === "admin" ? "default" : "secondary"}>{profile.role === "admin" ? "Admin" : "Membro"}</Badge>
              <Badge variant={profile.is_active ? "outline" : "destructive"}>{profile.is_active ? "Ativo" : "Inativo"}</Badge>
              {isCurrentAdmin ? <Badge variant="outline" className="border-border text-muted-foreground">você</Badge> : null}
            </div>
            <p className="mt-1 truncate text-xs text-ff-subtle-foreground">{profile.email || "Email não informado"}</p>
            <p className="mt-0.5 truncate text-xs text-ff-subtle-foreground">Membro: {profile.family_members?.name || "Sem vínculo"} · {accessStatus}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2 md:justify-end">
          {!isCurrentAdmin && !profile.auth_user_id ? <AdminUserInvitationForm profileId={profile.id} /> : null}
          {!isCurrentAdmin && !profile.auth_user_id ? <AdminUserSyncForm profileId={profile.id} /> : null}
          <AdminUserStatusForm profileId={profile.id} isActive={profile.is_active} disabled={isCurrentAdmin} />
          {!isCurrentAdmin ? <AdminUserDeleteForm profileId={profile.id} /> : null}
        </div>
      </div>

      {!isCurrentAdmin ? (
        <details className="rounded-2xl border border-border bg-ff-bg-soft p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Editar acesso
          </summary>
          <AdminUserEditForm profile={profile} members={members} />
        </details>
      ) : null}
    </div>
  );
}
