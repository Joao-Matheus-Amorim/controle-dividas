"use client";

import { useActionState, useState } from "react";

import { createBankAccount, updateBankAccount } from "@/app/protected/bancos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import {
  financeAutomaticMemberClass,
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeGridTwoClass,
  financeInputClass,
  financeNativeSelectClass,
  financeSelectTriggerClass,
  financeSubmitBarClass,
  financeSubmitButtonClass,
} from "@/components/finance/finance-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSystemBankOption, systemBankOptions } from "@/lib/finance/bank-options";
import type { BankAccountFormState, DbBankAccount, DbFamilyMember } from "@/lib/finance/types";

const initialState: BankAccountFormState = {};
const emptyAccountTypeValue = "__none";

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
  defaultMemberId?: string;
};

export function BankAccountForm({
  members,
  account,
  mode = "create",
  defaultMemberId,
}: BankAccountFormProps) {
  const action = mode === "edit" ? updateBankAccount : createBankAccount;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = mode === "edit" && Boolean(account);
  const [accountTypeValue, setAccountTypeValue] = useState(account?.account_type ?? emptyAccountTypeValue);
  const selectedBankName = account?.bank_name ?? "";
  const legacyBankName = selectedBankName && !isSystemBankOption(selectedBankName)
    ? selectedBankName
    : null;
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;

  return (
    <form action={formAction} className={financeFormClass}>
      {account ? <input type="hidden" name="id" value={account.id} /> : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `family_member_id-${account?.id}` : "family_member_id"}>Pessoa vinculada</Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="family_member_id" value={automaticMember.id} />
              <div className={financeAutomaticMemberClass}>
                <p className="font-semibold">{automaticMember.name}</p>
                <p className="mt-1 text-xs text-white/45">Pessoa definida automaticamente pelo seu acesso.</p>
              </div>
            </>
          ) : (
            <select
              id={isEditing ? `family_member_id-${account?.id}` : "family_member_id"}
              name="family_member_id"
              defaultValue={account?.family_member_id ?? defaultMemberId ?? ""}
              required
              className={financeNativeSelectClass}
            >
              <option value="">Selecione uma pessoa</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `bank_name-${account?.id}` : "bank_name"}>Nome do banco</Label>
          <select
            id={isEditing ? `bank_name-${account?.id}` : "bank_name"}
            name="bank_name"
            defaultValue={selectedBankName}
            required
            className={financeNativeSelectClass}
          >
            <option value="">Selecione um banco</option>
            {legacyBankName ? (
              <option value={legacyBankName}>{legacyBankName} (cadastrado)</option>
            ) : null}
            {systemBankOptions.map((bankName) => (
              <option key={bankName} value={bankName}>
                {bankName}
              </option>
            ))}
          </select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `account_type-${account?.id}` : "account_type"}>Tipo de conta</Label>
          <Select name="account_type_select" value={accountTypeValue} onValueChange={setAccountTypeValue}>
            <SelectTrigger id={isEditing ? `account_type-${account?.id}` : "account_type"} className={financeSelectTriggerClass}>
              <SelectValue placeholder="Tipo de conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={emptyAccountTypeValue}>Sem tipo informado</SelectItem>
              {accountTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="account_type" value={accountTypeValue === emptyAccountTypeValue ? "" : accountTypeValue} />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `current_balance-${account?.id}` : "current_balance"}>Saldo atual</Label>
          <Input
            id={isEditing ? `current_balance-${account?.id}` : "current_balance"}
            name="current_balance"
            type="number"
            step="0.01"
            placeholder="500.00"
            defaultValue={account ? String(account.current_balance) : ""}
            required
            className={financeInputClass}
          />
        </div>
      </div>

      <div className={financeGridTwoClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `currency-${account?.id}` : "currency"}>Moeda</Label>
          <Input
            id={isEditing ? `currency-${account?.id}` : "currency"}
            name="currency"
            defaultValue={account?.currency ?? "EUR"}
            className={financeInputClass}
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `notes-${account?.id}` : "notes"}>Observacao</Label>
          <Input
            id={isEditing ? `notes-${account?.id}` : "notes"}
            name="notes"
            placeholder="Opcional"
            defaultValue={account?.notes ?? ""}
            className={financeInputClass}
          />
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={financeSubmitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar banco"}
        </Button>
      </div>
    </form>
  );
}
