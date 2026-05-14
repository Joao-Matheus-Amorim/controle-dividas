import { AlertTriangle, CalendarDays, CheckCircle2, Trash2, WalletCards } from "lucide-react";

import { deletePayableBill, updatePayableBillStatus } from "./actions";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance/calculations";
import { getPayableBillsDashboardData } from "@/lib/finance/server";

function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "pago") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}

function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export default async function ContasAPagarPage() {
  const {
    members,
    bills,
    totalPending,
    totalOverdue,
    totalPaid,
    pendingCount,
    overdueCount,
  } = await getPayableBillsDashboardData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Junho</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Contas</h1>
          <p className="mt-1 text-sm text-white/40">Pagamentos e vencimentos</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#f7b84b]">
          <WalletCards className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f7b84b]/20 bg-[linear-gradient(135deg,#2a1a08_0%,#140c05_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#f7b84b]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Total em aberto</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(totalPending + totalOverdue)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Pendentes</p>
              <p className="mt-1 text-sm font-semibold text-[#f7b84b]">{pendingCount} · {compactCurrency(totalPending)}</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Atrasadas</p>
              <p className="mt-1 text-sm font-semibold text-[#f0506e]">{overdueCount} · {compactCurrency(totalOverdue)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CalendarDays className="h-4 w-4 text-[#f7b84b]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pendentes</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPending)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <AlertTriangle className="h-4 w-4 text-[#f0506e]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Atraso</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalOverdue)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CheckCircle2 className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pagas</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalPaid)}</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Nova conta</p>
          <p className="text-xs font-semibold text-[#8b72f8]">formulário</p>
        </div>
        <PayableBillForm members={members} />
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Contas cadastradas</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{bills.length}</p>
        </div>

        {bills.length === 0 ? (
          <p className="text-sm text-white/35">Nenhuma conta cadastrada ainda.</p>
        ) : (
          bills.map((bill) => (
            <div key={bill.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                  <Badge variant={statusVariant(bill.computed_status)}>{bill.computed_status}</Badge>
                  {bill.recurrence ? <Badge variant="outline" className="border-white/10 text-white/50">{bill.recurrence}</Badge> : null}
                </div>
                <p className="mt-1 truncate text-xs text-white/35">{bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}</p>
                <p className="mt-0.5 truncate text-xs text-white/25">Vencimento: {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString("pt-BR")}{bill.bank_used ? ` · ${bill.bank_used}` : ""}</p>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <p className="text-sm font-bold text-white">{compactCurrency(Number(bill.amount))}</p>
                <form action={updatePayableBillStatus} className="flex gap-2">
                  <input type="hidden" name="id" value={bill.id} />
                  <select name="status" defaultValue={bill.status} className="h-9 rounded-xl border border-white/10 bg-[#080810] px-2 text-xs text-white/70">
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                  <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">Salvar</Button>
                </form>
                <form action={deletePayableBill}>
                  <input type="hidden" name="id" value={bill.id} />
                  <Button type="submit" variant="outline" size="icon" aria-label="Excluir conta" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
