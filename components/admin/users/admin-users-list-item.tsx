import { Badge } from "@/components/ui/badge";
import type { DbProfile } from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";
import { AdminUserDeleteForm } from "./admin-user-delete-form";
import { AdminUserEditForm } from "./admin-user-edit-form";
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
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5caaff]/15 text-xs font-bold text-[#5caaff]">
            {profile.role === "admin" ? "AD" : initials(profile.name)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
              <Badge variant={profile.role === "admin" ? "default" : "secondary"}>{profile.role === "admin" ? "Admin" : "Membro"}</Badge>
              <Badge variant={profile.is_active ? "outline" : "destructive"}>{profile.is_active ? "Ativo" : "Inativo"}</Badge>
              {isCurrentAdmin ? <Badge variant="outline" className="border-white/10 text-white/50">você</Badge> : null}
            </div>
            <p className="mt-1 truncate text-xs text-white/35">{profile.email || "Email não informado"}</p>
            <p className="mt-0.5 truncate text-xs text-white/25">Membro: {profile.family_members?.name || "Sem vínculo"} · {accessStatus}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2 md:justify-end">
          {!isCurrentAdmin && !profile.auth_user_id ? <AdminUserSyncForm profileId={profile.id} /> : null}
          <AdminUserStatusForm profileId={profile.id} isActive={profile.is_active} disabled={isCurrentAdmin} />
          {!isCurrentAdmin ? <AdminUserDeleteForm profileId={profile.id} /> : null}
        </div>
      </div>

      {!isCurrentAdmin ? (
        <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            Editar acesso
          </summary>
          <AdminUserEditForm profile={profile} members={members} />
        </details>
      ) : null}
    </div>
  );
}
