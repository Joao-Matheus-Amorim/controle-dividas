"use client";

import { useActionState } from "react";

import { createReceivableIncome, updateReceivableIncome } from "@/app/protected/contas-a-receber/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import {
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeGridThreeClass,
  financeNativeSelectClass,
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
import type { DbFamilyMember, DbReceivableIncome, ReceivableIncomeFormState } from "@/lib/finance/types";

const initialState: ReceivableIncomeFormState = {};

const incomeSources = [
  "Salario",
  "Empresa / servicos",
  "Comissao",
  "Vendas",
  "Trabalhos extras",
  "Mesada / apoio financeiro",
  "Outros",
];

type ReceivableIncomeFormProps = {
  members: DbFamilyMember[];
  income?: DbReceivableIncome;
  mode?: "create" | "edit";
  defaultMemberId?: string;
};

export function ReceivableIncomeForm({
  members,
  income,
  mode = "create",
  defaultMemberId,
}: ReceivableIncomeFormProps) {
  const action = mode === "edit" ? updateReceivableIncome : createReceivableIncome;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(income);
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;

  return (
    <form action={formAction} className={financeFormClass}>
      {income ? <input type="hidden" name="id" value={income.id} /> : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}>Pessoa que vai receber</Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="receiver_member_id" value={automaticMember.id} />
              <div className="min-h-11 rounded-2xl border border-white/10 bg-[#080810]/70 px-4 py-3 text-sm text-white">
                <p className="font-semibold">{automaticMember.name}</p>
                <p className="mt-1 text-xs text-white/45">Pessoa definida automaticamente pelo seu acesso.</p>
              </div>
            </>
          ) : (
            <select
              id={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}
              name="receiver_member_id"
              defaultValue={income?.receiver_member_id ?? defaultMemberId ?? ""}
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
          <Label htmlFor={isEditing ? `source-${income?.id}` : "source"}>Origem do dinheiro</Label>
          <select
            id={isEditing ? `source-${income?.id}` : "source"}
            name="source"
            defaultValue={income?.source ?? ""}
            required
            className={financeNativeSelectClass}
          >
            <option value="">Selecione</option>
            {incomeSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `income_type-${income?.id}` : "income_type"}>Tipo de renda</Label>
          <Select name="income_type" defaultValue={income?.income_type ?? "fixa"}>
            <SelectTrigger id={isEditing ? `income_type-${income?.id}` : "income_type"}>
              <SelectValue placeholder="Tipo de renda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixa">Fixa</SelectItem>
              <SelectItem value="variavel">Variavel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `amount-${income?.id}` : "amount"}>Valor em euro</Label>
          <Input
            id={isEditing ? `amount-${income?.id}` : "amount"}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="1450.00"
            defaultValue={income ? String(income.amount) : ""}
            required
          />
        </div>
      </div>

      <div className={financeGridThreeClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `expected_date-${income?.id}` : "expected_date"}>Data prevista</Label>
          <Input
            id={isEditing ? `expected_date-${income?.id}` : "expected_date"}
            name="expected_date"
            type="date"
            defaultValue={income?.expected_date ?? today}
            required
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `status-${income?.id}` : "status"}>Status</Label>
          <Select name="status" defaultValue={income?.status ?? "previsto"}>
            <SelectTrigger id={isEditing ? `status-${income?.id}` : "status"}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previsto">Previsto</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `receiving_bank-${income?.id}` : "receiving_bank"}>Banco de recebimento</Label>
          <Input
            id={isEditing ? `receiving_bank-${income?.id}` : "receiving_bank"}
            name="receiving_bank"
            placeholder="Ex: Revolut, Wise"
            defaultValue={income?.receiving_bank ?? ""}
          />
        </div>
      </div>

      <div className={financeFieldClass}>
        <Label htmlFor={isEditing ? `notes-${income?.id}` : "notes"}>Observacao</Label>
        <Input
          id={isEditing ? `notes-${income?.id}` : "notes"}
          name="notes"
          placeholder="Opcional"
          defaultValue={income?.notes ?? ""}
        />
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={financeSubmitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar recebimento"}
        </Button>
      </div>
    </form>
  );
}
