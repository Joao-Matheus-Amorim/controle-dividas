import { ShieldCheck, Trash2, UserRoundCheck, UsersRound } from "lucide-react";

import { deleteFamilyUser, toggleFamilyUserStatus, updateFamilyUser } from "../actions";
import { FamilyUserFormDialog } from "@/components/finance/family-user-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminUsuariosPage() {
  const { adminProfile, profiles, members } = await getAdminDashboardData();
  const familyUsers = profiles.filter((profile) => profile.role !== "admin");
  const activeProfiles = profiles.filter((profile) => profile.is_active);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Admin</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Usuários</h1>
          <p className="mt-1 text-sm text-white/40">Acessos da família</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#5caaff]">
          <UsersRound className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#5caaff]/20 bg-[linear-gradient(135deg,#07172e_0%,#061020_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#5caaff]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Acessos familiares</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{profiles.length}</p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Membros</p>
              <p className="mt-1 text-sm font-semibold text-[#5caaff]">{familyUsers.length} acesso(s)</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Ativos</p>
              <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{activeProfiles.length} perfil(is)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <ShieldCheck className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Admin</p>
          <p className="mt-1 text-sm font-bold text-white">1</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <UserRoundCheck className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Ativos</p>
          <p className="mt-1 text-sm font-bold text-white">{activeProfiles.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <UsersRound className="h-4 w-4 text-[#5caaff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Membros</p>
          <p className="mt-1 text-sm font-bold text-white">{members.length}</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo acesso</p>
            <p className="mt-1 text-sm text-white/40">Crie um login vinculado a um membro da família.</p>
          </div>
          <FamilyUserFormDialog members={members} />
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Acessos cadastrados</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{profiles.length}</p>
        </div>

        {profiles.map((profile) => {
          const isCurrentAdmin = profile.id === adminProfile.id;
          const accessStatus = profile.auth_user_id ? "Acesso ativado" : "Aguardando primeiro acesso";

          return (
            <div key={profile.id} className="space-y-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
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
                  <form action={toggleFamilyUserStatus}>
                    <input type="hidden" name="id" value={profile.id} />
                    <input type="hidden" name="is_active" value={String(profile.is_active)} />
                    <Button type="submit" variant="outline" disabled={isCurrentAdmin} className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-40">
                      {profile.is_active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>

                  {!isCurrentAdmin ? (
                    <form action={deleteFamilyUser}>
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
                  <form action={updateFamilyUser} className="mt-4 grid gap-3 md:grid-cols-4">
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
        })}
      </section>
    </div>
  );
}