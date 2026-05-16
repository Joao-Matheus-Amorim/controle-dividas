import { AlertTriangle, CheckCircle2, Clock3, Repeat, Trash2, WalletCards } from "lucide-react";

import { deleteReceivableIncome, updateReceivableIncomeStatus } from "./actions";
import { ReceivableIncomeFormDialog } from "@/components/finance/receivable-income-form-dialog";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, getModulePermission } from "@/lib/finance/access-control";
import { formatCurrency } from "@/lib/finance/calculations";
import { getCurrentMonthLabel } from "@/lib/finance/period-context";
import { getReceivableIncomesDashboardData } from "@/lib/finance/server";

function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "recebido") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export default async function ContasAReceberPage() {
  const [profile, receivableData] = await Promise.all([
    getCurrentProfile(),
    getReceivableIncomesDashboardData(),
  ]);
  const permission = profile.role === "admin" ? null : await getModulePermission(profile.id, "CONTAS_A_RECEBER");
  const canCreate = profile.role === "admin" || Boolean(permission?.can_create);
  const canEdit = profile.role === "admin" || Boolean(permission?.can_edit);
  const canDelete = profile.role === "admin" || Boolean(permission?.can_delete);
  const periodLabel = getCurrentMonthLabel();

  const {
    members,
    incomes,
    totalExpected,
    totalOverdue,
    totalReceived,
    totalFixed,
    totalVariable,
    overdueCount,
    receivedCount,
  } = receivableData;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">{periodLabel}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Receber</h1>
          <p className="mt-1 text-sm text-white/40">Entradas e rendas</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#1de9b2]">
          <WalletCards className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#1de9b2]/20 bg-[linear-gradient(135deg,#071e18_0%,#03110d_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#1de9b2]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total previsto</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(totalExpected + totalOverdue)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Recebido</p>
              <p className="mt-1 text-sm font-semibold text-[#1de9b2]">{receivedCount} · {compactCurrency(totalReceived)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Atrasado</p>
              <p className="mt-1 text-sm font-semibold text-[#f0506e]">{overdueCount} · {compactCurrency(totalOverdue)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 md:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Clock3 className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Previsto</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalExpected)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CheckCircle2 className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Recebido</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalReceived)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <AlertTriangle className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Atraso</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalOverdue)}</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
          <Repeat className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Fixa</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalFixed)}</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
          <WalletCards className="h-4 w-4 text-[#5caaff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Variável</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalVariable)}</p>
        </div>
      </section>

      {canCreate ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo recebimento</p>
              <p className="mt-1 text-sm text-white/40">Cadastre entradas e rendas sem poluir a tela principal.</p>
            </div>
            <ReceivableIncomeFormDialog members={members} />
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Recebimentos</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{incomes.length}</p>
        </div>

        {incomes.length === 0 ? (
          <p className="text-sm text-white/35">Nenhuma conta a receber cadastrada ainda.</p>
        ) : (
          incomes.map((income) => (
            <div key={income.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{income.source}</p>
                  <Badge variant={statusVariant(income.computed_status)}>{income.computed_status}</Badge>
                  <Badge variant="outline" className="border-white/10 text-white/50">renda {income.income_type}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-white/35">{income.family_members?.name || "Sem pessoa vinculada"}</p>
                <p className="mt-0.5 truncate text-xs text-white/25">Data prevista: {new Date(`${income.expected_date}T00:00:00`).toLocaleDateString("pt-BR")}{income.receiving_bank ? ` · ${income.receiving_bank}` : ""}</p>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <p className="text-sm font-bold text-[#1de9b2]">{compactCurrency(Number(income.amount))}</p>
                {canEdit ? (
                  <form action={updateReceivableIncomeStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={income.id} />
                    <select name="status" defaultValue={income.status} className="h-9 rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70">
                      <option value="previsto">Previsto</option>
                      <option value="recebido">Recebido</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                    <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">Salvar</Button>
                  </form>
                ) : null}
                {canDelete ? (
                  <form action={deleteReceivableIncome}>
                    <input type="hidden" name="id" value={income.id} />
                    <Button type="submit" variant="outline" size="icon" aria-label="Excluir recebimento" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
