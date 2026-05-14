import { BellRing, Euro, ShieldCheck, Trash2 } from "lucide-react";

import {
  deleteExpenseCategory,
  updateFamilyMemberLimit,
} from "./actions";
import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/finance/calculations";
import { getExpenseCategories, getFamilyMembers } from "@/lib/finance/server";

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export default async function ConfiguracoesPage() {
  const [members, categories] = await Promise.all([
    getFamilyMembers(),
    getExpenseCategories(),
  ]);

  const totalLimit = members.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Sistema</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Configurações</h1>
          <p className="mt-1 text-sm text-white/40">Limites, categorias e regras</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
          <ShieldCheck className="h-5 w-5" />
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Categorias</p>
              <p className="mt-1 text-sm font-semibold text-[#b09cff]">{categories.length} cadastrada(s)</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Moeda</p>
              <p className="mt-1 text-sm font-semibold text-white/85">EUR</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Euro className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Limite</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalLimit)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <ShieldCheck className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Categorias</p>
          <p className="mt-1 text-sm font-bold text-white">{categories.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <BellRing className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Moeda</p>
          <p className="mt-1 text-sm font-bold text-white">EUR</p>
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Limites mensais</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{members.length}</p>
        </div>
        {members.map((member) => (
          <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white">{member.name}</p>
                <Badge variant={member.is_active ? "secondary" : "outline"}>{member.is_active ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="mt-1 text-xs text-white/35">Limite atual: {compactCurrency(Number(member.monthly_limit))}</p>
            </div>

            <form action={updateFamilyMemberLimit} className="flex gap-2">
              <input type="hidden" name="id" value={member.id} />
              <Input
                name="monthly_limit"
                type="number"
                min="0"
                step="0.01"
                defaultValue={Number(member.monthly_limit)}
                className="h-9 w-28 rounded-xl border-white/10 bg-[#080810] text-xs text-white"
              />
              <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">Salvar</Button>
            </form>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova categoria</p>
            <p className="text-xs font-semibold text-[#8b72f8]">formulário</p>
          </div>
          <ExpenseCategoryForm />
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
            <p className="text-xs font-semibold text-[#8b72f8]">{categories.length}</p>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{category.name}</p>
                  {category.is_default ? <Badge variant="secondary">padrão</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-white/35">{category.description || "Sem descrição"}</p>
              </div>

              {!category.is_default ? (
                <form action={deleteExpenseCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <Button type="submit" variant="outline" size="icon" aria-label="Excluir categoria" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Regras automáticas</p>
        {[
          "Gastos reduzem automaticamente o saldo mensal da pessoa.",
          "Contas vencidas aparecem como atrasadas no dashboard.",
          "Recebimentos vencidos e não recebidos aparecem como atrasados.",
          "Alterar limite mensal recalcula dashboard, gastos e relatórios.",
          "Categorias padrão ficam protegidas contra exclusão acidental.",
          "Todos os valores usam euro como moeda padrão do sistema.",
        ].map((rule) => (
          <div key={rule} className="rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-sm text-white/45">
            {rule}
          </div>
        ))}
      </section>
    </div>
  );
}
