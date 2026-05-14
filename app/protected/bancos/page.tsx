import { Banknote, CreditCard, Trash2, Users } from "lucide-react";

import { deleteBankAccount, updateBankAccountBalance } from "./actions";
import { BankAccountFormDialog } from "@/components/finance/bank-account-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/finance/calculations";
import { getBanksDashboardData } from "@/lib/finance/banks-server";

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

export default async function BancosPage() {
  const { members, accounts, accountsByMember, totalBalance, totalAccounts } =
    await getBanksDashboardData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 md:max-w-7xl">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Família</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Bancos</h1>
          <p className="mt-1 text-sm text-white/40">Contas e saldos</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#5caaff]">
          <Banknote className="h-5 w-5" />
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#5caaff]/20 bg-[linear-gradient(135deg,#07172e_0%,#061020_55%,#080810_100%)] p-5 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#5caaff]/10 blur-2xl" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Saldo total em bancos</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {compactCurrency(totalBalance)}
          </p>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Contas</p>
              <p className="mt-1 text-sm font-semibold text-[#5caaff]">{totalAccounts} cadastrada(s)</p>
            </div>
            <div className="pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Membros</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{members.length} pessoa(s)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Banknote className="h-4 w-4 text-[#5caaff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Saldo</p>
          <p className="mt-1 text-sm font-bold text-white">{compactCurrency(totalBalance)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <CreditCard className="h-4 w-4 text-[#b09cff]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Contas</p>
          <p className="mt-1 text-sm font-bold text-white">{totalAccounts}</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:block">
          <Users className="h-4 w-4 text-[#1de9b2]" />
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Pessoas</p>
          <p className="mt-1 text-sm font-bold text-white">{members.length}</p>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Novo banco</p>
            <p className="mt-1 text-sm text-white/40">Cadastre contas e saldos sem poluir a tela principal.</p>
          </div>
          <BankAccountFormDialog members={members} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Saldo por pessoa</p>
          <p className="text-xs font-semibold text-[#8b72f8]">membros</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {accountsByMember.map((member) => (
            <div key={member.id} className="min-w-[118px] rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5caaff]/15 text-xs font-bold text-[#5caaff]">
                  {initials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                  <p className="text-xs text-white/35">{member.accounts.length} conta(s)</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-[#1de9b2]">{compactCurrency(member.totalBalance)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Bancos cadastrados</p>
          <p className="text-xs font-semibold text-[#8b72f8]">{accounts.length}</p>
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-white/35">Nenhum banco cadastrado ainda.</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#080810]/50 p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5caaff]/10 text-[#5caaff]">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{account.bank_name}</p>
                    <Badge variant="outline" className="border-white/10 text-white/50">{account.currency}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/35">
                    {account.family_members?.name || "Sem pessoa vinculada"} · {account.account_type || "Tipo não informado"}
                  </p>
                  {account.notes ? <p className="mt-0.5 truncate text-xs text-white/25">{account.notes}</p> : null}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <form action={updateBankAccountBalance} className="flex gap-2">
                  <input type="hidden" name="id" value={account.id} />
                  <Input
                    name="current_balance"
                    type="number"
                    step="0.01"
                    defaultValue={Number(account.current_balance)}
                    className="h-9 w-28 rounded-xl border-white/10 bg-[#080810] text-xs text-white"
                  />
                  <Button type="submit" variant="outline" className="h-9 rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white">Salvar</Button>
                </form>
                <form action={deleteBankAccount}>
                  <input type="hidden" name="id" value={account.id} />
                  <Button type="submit" variant="outline" size="icon" aria-label="Excluir banco" className="h-9 w-9 rounded-xl border-white/10 bg-transparent text-white/35 hover:bg-white/10 hover:text-white">
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