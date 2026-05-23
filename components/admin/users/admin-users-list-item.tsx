import {
  deleteFamilyUserFormAction,
  syncFamilyUserAuthLinkFormAction,
  toggleFamilyUserStatusFormAction,
  updateFamilyUserFormAction,
} from "@/app/protected/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DbProfile } from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";
import { Link2, Trash2 } from "lucide-react";
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

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {!isCurrentAdmin && !profile.auth_user_id ? (
            <form action={syncFamilyUserAuthLinkFormAction}>
              <input type="hidden" name="id" value={profile.id} />
              <Button type="submit" variant="outline" className="h-9 rounded-xl border-[#8b72f8]/30 bg-[#8b72f8]/10 text-[#b09cff] hover:bg-[#8b72f8]/20">
                <Link2 className="mr-2 h-4 w-4" />
                Sincronizar login
              </Button>
            </form>
          ) : null}

          <form action={toggleFamilyUserStatusFormAction}>
            <input type="hidden" name="id" value={profile.id} />
            <input type="hidden" name="is_active" value={String(profile.is_active)} />
            <Button type="submit" variant="outline" disabled={isCurrentAdmin} className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40">
              {profile.is_active ? "Desativar" : "Ativar"}
            </Button>
          </form>

          {!isCurrentAdmin ? (
            <form action={deleteFamilyUserFormAction}>
              <input type="hidden" name="id" value={profile.id} />
              <Button type="submit" variant="outline" size="icon" aria-label="Excluir acesso" className="h-9 w-9 rounded-xl border-[#f0506e]/20 bg-[#f0506e]/10 text-[#f0506e] hover:bg-[#f0506e]/20">
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {!isCurrentAdmin ? (
        <details className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            Editar acesso
          </summary>
          <form action={updateFamilyUserFormAction} className="mt-4 grid gap-3 md:grid-cols-4">
            <input type="hidden" name="id" value={profile.id} />
            <Input name="name" defaultValue={profile.name} placeholder="Nome" className="h-10 rounded-xl" required />
            <Input name="email" type="email" defaultValue={profile.email || ""} placeholder="Email" className="h-10 rounded-xl" required />
            <select name="linked_family_member_id" defaultValue={profile.linked_family_member_id || ""} className="h-10 rounded-xl border border-white/10 bg-[#080810] px-3 text-sm text-white">
              <option value="">Selecione o membro</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <Button type="submit" className="h-10 rounded-xl bg-[#8b72f8] text-white hover:bg-[#7d66e4]">
              Salvar
            </Button>
          </form>
        </details>
      ) : null}
    </div>
  );
}
