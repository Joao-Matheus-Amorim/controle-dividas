"use client";

import { useActionState } from "react";

import { createBankAccount } from "@/app/protected/bancos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccountFormState } from "@/lib/finance/banks-server";
import type { DbFamilyMember } from "@/lib/finance/server";

const initialState: BankAccountFormState = {};

const accountTypes = [
  "Conta corrente",
  "Conta digital",
  "Poupanca",
  "Cartao de credito",
  "Cartao pre-pago",
  "Dinheiro",
  "Outros",
];

export function BankAccountForm({ members }: { members: DbFamilyMember[] }) {
  const [state, formAction, isPending] = useActionState(createBankAccount, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="family_member_id">Pessoa vinculada</Label>
          <select
            id="family_member_id"
            name="family_member_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sem pessoa vinculada</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_name">Nome do banco</Label>
          <Input id="bank_name" name="bank_name" placeholder="Ex: Revolut, Wise" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_type">Tipo de conta</Label>
          <select
            id="account_type"
            name="account_type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_balance">Saldo atual</Label>
          <Input
            id="current_balance"
            name="current_balance"
            type="number"
            step="0.01"
            placeholder="500.00"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Moeda</Label>
          <Input id="currency" name="currency" defaultValue="EUR" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observacao</Label>
          <Input id="notes" name="notes" placeholder="Opcional" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar banco"}
      </Button>
    </form>
  );
}
