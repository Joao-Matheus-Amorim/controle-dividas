"use client";

import { useActionState } from "react";

import { createReceivableIncome, updateReceivableIncome } from "@/app/protected/contas-a-receber/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { FinanceDateField } from "@/components/finance/finance-date-field";
import {
  financeAutomaticMemberClass,
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeGridThreeClass,
  financeHelperTextClass,
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
import type { DbFamilyMember, DbReceivableIncome, ReceivableIncomeFormState } from "@/lib/finance/types";

const initialState: ReceivableIncomeFormState = {};

const incomeSources = [
  "Renda fixa",
  "Salário",
  "Comissão",
  "Freelance / serviços",
  "Vendas",
  "Bônus",
  "Aluguel recebido",
  "Reembolso",
  "Mesada / apoio financeiro",
  "Outros",
];

const legacyIncomeSourceLabels: Record<string, string> = {
  Salario: "Salário",
  Comissao: "Comissão",
  "Empresa / servicos": "Freelance / serviços",
};

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
  const selectedSource = income?.source ?? "";
  const sourceOptions = selectedSource && !incomeSources.includes(selectedSource)
    ? [selectedSource, ...incomeSources]
    : incomeSources;

  return (
    <form action={formAction} className={financeFormClass}>
      {income ? <input type="hidden" name="id" value={income.id} /> : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}>Pessoa que vai receber</Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="receiver_member_id" value={automaticMember.id} />
              <div className={financeAutomaticMemberClass}>
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
          <Label htmlFor={isEditing ? `source-${income?.id}` : "source"}>Entrada de dinheiro</Label>
          <select
            id={isEditing ? `source-${income?.id}` : "source"}
            name="source"
            defaultValue={selectedSource}
            required
            className={financeNativeSelectClass}
          >
            <option value="">Selecione a origem</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {legacyIncomeSourceLabels[source] ?? source}
              </option>
            ))}
          </select>
          <p className={financeHelperTextClass}>
            Ex: salário, comissão, venda, aluguel recebido ou reembolso.
          </p>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `income_type-${income?.id}` : "income_type"}>Tipo de renda</Label>
          <Select name="income_type" defaultValue={income?.income_type ?? "fixa"}>
            <SelectTrigger id={isEditing ? `income_type-${income?.id}` : "income_type"} className={financeSelectTriggerClass}>
              <SelectValue placeholder="Tipo de renda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixa">Fixa / recorrente</SelectItem>
              <SelectItem value="variavel">Variável / pontual</SelectItem>
            </SelectContent>
          </Select>
          <p className={financeHelperTextClass}>
            Use fixa para entradas recorrentes e variável para comissões, vendas e extras.
          </p>
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
            className={financeInputClass}
          />
        </div>
      </div>

      <div className={financeGridThreeClass}>
        <div className={financeFieldClass}>
          <FinanceDateField
            id={isEditing ? `expected_date-${income?.id}` : "expected_date"}
            name="expected_date"
            defaultValue={income?.expected_date ?? today}
            label="Data prevista"
            required
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `status-${income?.id}` : "status"}>Status</Label>
          <Select name="status" defaultValue={income?.status ?? "previsto"}>
            <SelectTrigger id={isEditing ? `status-${income?.id}` : "status"} className={financeSelectTriggerClass}>
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
            className={financeInputClass}
          />
        </div>
      </div>

      <div className={financeFieldClass}>
        <Label htmlFor={isEditing ? `notes-${income?.id}` : "notes"}>Observação</Label>
        <Input
          id={isEditing ? `notes-${income?.id}` : "notes"}
          name="notes"
          placeholder="Opcional"
          defaultValue={income?.notes ?? ""}
          className={financeInputClass}
        />
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={financeSubmitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar entrada"}
        </Button>
      </div>
    </form>
  );
}
