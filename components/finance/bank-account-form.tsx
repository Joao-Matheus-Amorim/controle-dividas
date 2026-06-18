"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

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
import {
  isSystemBankOption,
  isSystemCurrencyOption,
  systemBankOptions,
  systemCurrencyOptions,
} from "@/lib/finance/bank-options";
import { buildBankAccountDraftSuggestion } from "@/lib/finance/bank-draft";
import type { BankAccountFormState, DbBankAccount, DbFamilyMember } from "@/lib/finance/types";

const initialState: BankAccountFormState = {};
const emptyAccountTypeValue = "__none";

const accountTypes = [
  "Conta a ordem",
  "Conta corrente",
  "Conta digital",
  "Conta pagamento",
  "Conta salario",
  "Poupanca",
  "Investimentos",
  "Cartao de credito",
  "Cartao de debito",
  "Cartao pre-pago",
  "Beneficio refeicao",
  "Carteira digital",
  "Dinheiro",
  "Outros",
];

type BankAccountFormProps = {
  members: DbFamilyMember[];
  account?: DbBankAccount;
  mode?: "create" | "edit";
  defaultMemberId?: string;
  onSuccess?: () => void;
};

export function BankAccountForm({
  members,
  account,
  mode = "create",
  defaultMemberId,
  onSuccess,
}: BankAccountFormProps) {
  const action = mode === "edit" ? updateBankAccount : createBankAccount;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = mode === "edit" && Boolean(account);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftApplied, setDraftApplied] = useState(false);
  const [accountTypeValue, setAccountTypeValue] = useState(account?.account_type ?? emptyAccountTypeValue);
  const selectedBankName = account?.bank_name ?? "";
  const [bankName, setBankName] = useState(selectedBankName);
  const legacyBankName = selectedBankName && !isSystemBankOption(selectedBankName)
    ? selectedBankName
    : null;
  const selectedCurrency = account?.currency ?? "EUR";
  const [currency, setCurrency] = useState(selectedCurrency);
  const [currentBalance, setCurrentBalance] = useState(account ? String(account.current_balance) : "");
  const [notes, setNotes] = useState(account?.notes ?? "");
  const legacyCurrency = selectedCurrency && !isSystemCurrencyOption(selectedCurrency)
    ? selectedCurrency
    : null;
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  function applyDraftSuggestion() {
    const suggestion = buildBankAccountDraftSuggestion(draftPrompt);

    setBankName(suggestion.bankName);
    setAccountTypeValue(suggestion.accountType || emptyAccountTypeValue);
    setCurrentBalance(suggestion.currentBalance);
    setCurrency(suggestion.currency);
    setNotes(suggestion.notes);
    setDraftApplied(true);
  }

  return (
    <form action={formAction} className={financeFormClass}>
      {account ? <input type="hidden" name="id" value={account.id} /> : null}

      {!isEditing ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Rascunho assistido</p>
              <p className="mt-1 text-sm text-white/45">Descreva a conta e revise os campos antes de cadastrar.</p>
            </div>
            {draftApplied ? (
              <span className="rounded-full bg-[#8b72f8]/15 px-3 py-1 text-xs font-semibold text-[#c9bfff]">
                rascunho aplicado
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={draftPrompt}
              onChange={(event) => {
                setDraftPrompt(event.target.value);
                setDraftApplied(false);
              }}
              placeholder="Ex: Cartao Itau saldo 500 EUR"
              className={financeInputClass}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-2xl px-4"
              onClick={applyDraftSuggestion}
              disabled={!draftPrompt.trim()}
            >
              <Sparkles className="h-4 w-4" />
              Sugerir
            </Button>
          </div>
        </div>
      ) : null}

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
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
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
            value={currentBalance}
            onChange={(event) => setCurrentBalance(event.target.value)}
            required
            className={financeInputClass}
          />
        </div>
      </div>

      <div className={financeGridTwoClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `currency-${account?.id}` : "currency"}>Moeda</Label>
          <select
            id={isEditing ? `currency-${account?.id}` : "currency"}
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            required
            className={financeNativeSelectClass}
          >
            {legacyCurrency ? (
              <option value={legacyCurrency}>{legacyCurrency} (cadastrada)</option>
            ) : null}
            {systemCurrencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `notes-${account?.id}` : "notes"}>Observacao</Label>
          <Input
            id={isEditing ? `notes-${account?.id}` : "notes"}
            name="notes"
            placeholder="Opcional"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
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
