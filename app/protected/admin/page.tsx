import { ArrowRight, KeyRound, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

export default async function AdminPage() {
  const { adminProfile, profiles, permissions, modules } = await getAdminDashboardData();

  const familyUsers = profiles.filter((profile) => profile.role === "user");
  const activeUsers = profiles.filter((profile) => profile.is_active);
  const configuredProfiles = new Set(permissions.map((permission) => permission.profile_id));

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Danyel</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Admin</h1>
          <p className="mt-1 text-sm text-white/40">Gerenciamento familiar</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Perfil Admin</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{adminProfile.name}</p>
          <p className="mt-2 text-sm text-white/45">{adminProfile.email || "Email não informado"}</p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Usuários</p>
              <p className="mt-1 text-sm font-semibold text-[#b09cff]">{familyUsers.length} familiar(es)</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Permissões</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{permissions.length} regra(s)</p>
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
          <UsersRound className="h-4 w-4 text-[#5caaff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Ativos</p>
          <p className="mt-1 text-sm font-bold text-white">{activeUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <KeyRound className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Perfis</p>
          <p className="mt-1 text-sm font-bold text-white">{configuredProfiles.size}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Usuários e membros</p>
            <p className="mt-2 text-sm text-white/45">Cadastre familiares, vincule membros financeiros e ative acessos.</p>
          </div>
          <Button asChild className="h-11 rounded-2xl bg-[#8b72f8] font-semibold text-white hover:bg-[#7d66e4]">
            <Link href="/protected/admin/usuarios">
              Gerenciar usuários
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Permissões por módulo</p>
            <p className="mt-2 text-sm text-white/45">Configure quem pode ver, criar, editar ou excluir em cada área.</p>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-2xl border-white/10 bg-transparent font-semibold text-white/70 hover:bg-white/10 hover:text-white">
            <Link href="/protected/admin/permissoes">
              Gerenciar permissões
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Módulos controláveis</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{modules.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {modules.map((module) => (
            <Badge key={module.key} variant="secondary" className="bg-white/10 text-white/65">
              {module.label}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
