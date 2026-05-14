import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";

import { PermissionsForm } from "@/components/finance/permissions-form";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

export default async function AdminPermissoesPage() {
  const { profiles, permissions, modules } = await getAdminDashboardData();
  const familyUsers = profiles.filter((profile) => profile.role !== "admin");
  const configuredProfiles = new Set(permissions.map((permission) => permission.profile_id));

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Admin</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Permissões</h1>
          <p className="mt-1 text-sm text-white/40">Acessos por módulo</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
          <KeyRound className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Controle de acesso</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{permissions.length}</p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Usuários</p>
              <p className="mt-1 text-sm font-semibold text-[#5caaff]">{familyUsers.length} configurável(is)</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Perfis</p>
              <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{configuredProfiles.size} com regras</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <UsersRound className="h-4 w-4 text-[#5caaff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Usuários</p>
          <p className="mt-1 text-sm font-bold text-white">{familyUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <KeyRound className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Regras</p>
          <p className="mt-1 text-sm font-bold text-white">{permissions.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <ShieldCheck className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Módulos</p>
          <p className="mt-1 text-sm font-bold text-white">{modules.length}</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Configurar permissões</p>
          <p className="text-xs font-semibold text-[#8b72f8]">ver · criar · editar · excluir</p>
        </div>
        <PermissionsForm profiles={profiles} permissions={permissions} />
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Módulos controláveis</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{modules.length}</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {modules.map((module) => (
            <div key={module.key} className="rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
              <p className="text-sm font-semibold text-white">{module.label}</p>
              <p className="mt-1 text-xs text-white/35">{module.key}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
