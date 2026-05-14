import { UserRoundCheck, UserRoundX, UsersRound } from "lucide-react";

import { toggleFamilyMemberStatus } from "./actions";
import { FamilyMemberFormDialog } from "@/components/finance/family-member-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance/calculations";
import { getFamilyMembers } from "@/lib/finance/server";

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function PessoasPage() {
  const members = await getFamilyMembers();
  const activeMembers = members.filter((member) => member.is_active);
  const totalLimit = members.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Família</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Pessoas</h1>
          <p className="mt-1 text-sm text-white/40">Membros e limites</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
          <UsersRound className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#8b72f8]/20 bg-[linear-gradient(135deg,#1a0f4e_0%,#0e0730_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8b72f8]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Limite familiar</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(totalLimit)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Ativos</p>
              <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{activeMembers.length} membro(s)</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Total</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{members.length} pessoa(s)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <UsersRound className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Membros</p>
          <p className="mt-1 text-sm font-bold text-white">{members.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <UserRoundCheck className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Ativos</p>
          <p className="mt-1 text-sm font-bold text-white">{activeMembers.length}</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
          <UserRoundX className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Inativos</p>
          <p className="mt-1 text-sm font-bold text-white">{members.length - activeMembers.length}</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova pessoa</p>
            <p className="mt-1 text-sm text-white/40">Cadastre membros sem poluir a tela principal.</p>
          </div>
          <FamilyMemberFormDialog />
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Membros cadastrados</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{members.length}</p>
        </div>

        {members.map((member) => (
          <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">
                {initials(member.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                  <Badge variant={member.is_active ? "secondary" : "outline"}>
                    {member.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-white/35">
                  {member.role || "Sem perfil informado"}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#1de9b2]">
                  Limite: {compactCurrency(Number(member.monthly_limit))}
                </p>
              </div>
            </div>

            <form action={toggleFamilyMemberStatus}>
              <input type="hidden" name="id" value={member.id} />
              <input type="hidden" name="is_active" value={String(member.is_active)} />
              <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">
                {member.is_active ? "Desativar" : "Ativar"}
              </Button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}