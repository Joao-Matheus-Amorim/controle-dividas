"use client";

import { useActionState } from "react";

import { createBankAccount, updateBankAccount } from "@/app/protected/bancos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccountFormState, DbBankAccount } from "@/lib/finance/banks-server";
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

type BankAccountFormProps = {
  members: DbFamilyMember[];
  account?: DbBankAccount;
  mode?: "create" | "edit";
};

export function BankAccountForm({ members, account, mode = "create" }: BankAccountFormProps) {
  const action = mode === "edit" ? updateBankAccount : createBankAccount;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = mode === "edit" && Boolean(account);

  return (
    <form action={formAction} className="space-y-5">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={isEditing ? `family_member_id-${account?.id}` : "family_member_id"}>Pessoa vinculada</Label>
          <select
            id={isEditing ? `family_member_id-${account?.id}` : "family_member_id"}
            name="family_member_id"
            defaultValue={account?.family_member_id ?? ""}
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
          <Label htmlFor={isEditing ? `bank_name-${account?.id}` : "bank_name"}>Nome do banco</Label>
          <Input
            id={isEditing ? `bank_name-${account?.id}` : "bank_name"}
            name="bank_name"
            placeholder="Ex: Revolut, Wise"
            defaultValue={account?.bank_name ?? ""}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={isEditing ? `account_type-${account?.id}` : "account_type"}>Tipo de conta</Label>
          <select
            id={isEditing ? `account_type-${account?.id}` : "account_type"}
            name="account_type"
            defaultValue={account?.account_type ?? ""}
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
          <Label htmlFor={isEditing ? `current_balance-${account?.id}` : "current_balance"}>Saldo atual</Label>
          <Input
            id={isEditing ? `current_balance-${account?.id}` : "current_balance"}
            name="current_balance"
            type="number"
            step="0.01"
            placeholder="500.00"
            defaultValue={account ? String(account.current_balance) : ""}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={isEditing ? `currency-${account?.id}` : "currency"}>Moeda</Label>
          <Input
            id={isEditing ? `currency-${account?.id}` : "currency"}
            name="currency"
            defaultValue={account?.currency ?? "EUR"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={isEditing ? `notes-${account?.id}` : "notes"}>Observacao</Label>
          <Input
            id={isEditing ? `notes-${account?.id}` : "notes"}
            name="notes"
            placeholder="Opcional"
            defaultValue={account?.notes ?? ""}
          />
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar banco"}
      </Button>
    </form>
  );
}
