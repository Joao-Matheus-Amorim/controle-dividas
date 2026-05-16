import { Plus, ReceiptText, TrendingDown, Users } from "lucide-react";

import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import { ExpenseListActions } from "@/components/finance/expense-list-actions";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { formatCurrency } from "@/lib/finance/calculations";
import { getExpenseDashboardData } from "@/lib/finance/server";

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

export default async function GastosPage() {
  const [profile, expenseData] = await Promise.all([
    getCurrentProfile(),
    getExpenseDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "GASTOS");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);

  const { members, categories, expenses, memberSummaries, totalExpenses } = expenseData;
  const totalLimit = memberSummaries.reduce((total, member) => total + Number(member.monthly_limit), 0);
  const totalRemaining = totalLimit - totalExpenses;

  const categoryTotals = categories
    .map((category) => {
      const total = expenses
        .filter((expense) => expense.category_id === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return { id: category.id, name: category.name, total };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Junho</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Gastos</h1>
          <p className="mt-1 text-sm text-white/40">Lançamentos da família</p>
        </div>
        {canCreate ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
            <Plus className="h-5 w-5" />
          </div>
        ) : null}
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f0506e]/20 bg-[linear-gradient(135deg,#2b0f22_0%,#140814_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f0506e]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total gasto no mês</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">{compactCurrency(totalExpenses)}</p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Saldo restante</p>
              <p className={totalRemaining < 0 ? "mt-1 text-sm font-semibold text-[#f0506e]" : "mt-1 text-sm font-semibold text-[#1de9b2]"}>
                {compactCurrency(totalRemaining)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Lançamentos</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{expenses.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <ReceiptText className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Gastos</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalExpenses)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Users className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pessoas</p>
          <p className="mt-1 text-sm font-bold text-white">{memberSummaries.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <TrendingDown className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Categorias</p>
          <p className="mt-1 text-sm font-bold text-white">{categoryTotals.length}</p>
        </div>
      </section>

      {canCreate ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo gasto</p>
              <p className="mt-1 text-sm text-white/40">Registre um lançamento sem poluir a tela principal.</p>
            </div>
            <ExpenseFormDialog members={members} categories={categories} />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Impacto por pessoa</p>
          <p className="text-xs font-semibold text-[#8b72f8]">limites</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {memberSummaries.map((member) => {
            const usedPercent = Math.min(Math.max(member.usedPercent, 0), 100);
            const exceeded = member.remaining < 0;

            return (
              <div key={member.id} className="min-w-[92px] rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#8b72f8]/15 text-xs font-bold text-[#b09cff]">{initials(member.name)}</div>
                <p className="mt-2 truncate text-[11px] font-semibold text-white/70">{member.name}</p>
                <p className="mt-1 text-[11px] font-bold text-white">{compactCurrency(member.spent)}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className={exceeded ? "h-full rounded-full bg-[#f0506e]" : "h-full rounded-full bg-[#8b72f8]"} style={{ width: `${usedPercent}%` }} />
                </div>
                <p className={exceeded ? "mt-2 text-[11px] font-bold text-[#f0506e]" : "mt-2 text-[11px] font-bold text-[#1de9b2]"}>{compactCurrency(member.remaining)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Categorias</p>
          <TrendingDown className="h-4 w-4 text-white/30" />
        </div>
        {categoryTotals.length === 0 ? (
          <p className="text-sm text-white/35">Cadastre gastos para ver categorias.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryTotals.slice(0, 8).map((category) => (
              <div key={category.id} className="min-w-[92px] rounded-2xl border border-white/10 bg-[#080810]/50 p-3 text-center">
                <p className="truncate text-[11px] font-semibold text-white/60">{category.name}</p>
                <p className="mt-2 text-sm font-bold text-white">{compactCurrency(category.total)}</p>
                <div className="mt-3 h-0.5 rounded-full bg-[#f0506e]" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Gastos cadastrados</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{expenses.length}</p>
        </div>

        {expenses.length === 0 ? (
          <p className="text-sm text-white/35">Nenhum gasto cadastrado ainda.</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0506e]/10 text-[#f0506e]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{expense.description}</p>
                  <Badge variant="secondary" className="border-white/10 bg-white/10 text-white/60">{expense.expense_categories?.name || "Sem categoria"}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-white/35">{expense.family_members?.name || "Pessoa não informada"} · {new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                <p className="mt-0.5 truncate text-xs text-white/25">{expense.purchase_location || "Local não informado"}{expense.payment_method ? ` · ${expense.payment_method}` : ""}{expense.bank_or_card ? ` · ${expense.bank_or_card}` : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-bold text-white">{compactCurrency(Number(expense.amount))}</p>
                <ExpenseListActions expense={expense} members={members} categories={categories} canEdit={canEdit} canDelete={canDelete} />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
