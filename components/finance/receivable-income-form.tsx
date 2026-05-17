"use client";

import { useActionState } from "react";

import { createReceivableIncome, updateReceivableIncome } from "@/app/protected/contas-a-receber/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
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
import type { DbFamilyMember, DbReceivableIncome, ReceivableIncomeFormState } from "@/lib/finance/server";

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
};

export function ReceivableIncomeForm({ members, income, mode = "create" }: ReceivableIncomeFormProps) {
  const action = mode === "edit" ? updateReceivableIncome : createReceivableIncome;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(income);

  return (
    <form action={formAction} className="space-y-5">
      {income ? <input type="hidden" name="id" value={income.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}>Pessoa que vai receber</Label>
          <select
            id={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}
            name="receiver_member_id"
            defaultValue={income?.receiver_member_id ?? ""}
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
          <Label htmlFor={isEditing ? `source-${income?.id}` : "source"}>Origem do dinheiro</Label>
          <select
            id={isEditing ? `source-${income?.id}` : "source"}
            name="source"
            defaultValue={income?.source ?? ""}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {incomeSources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={isEditing ? `expected_date-${income?.id}` : "expected_date"}>Data prevista</Label>
          <Input
            id={isEditing ? `expected_date-${income?.id}` : "expected_date"}
            name="expected_date"
            type="date"
            defaultValue={income?.expected_date ?? today}
            required
          />
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor={isEditing ? `receiving_bank-${income?.id}` : "receiving_bank"}>Banco de recebimento</Label>
          <Input
            id={isEditing ? `receiving_bank-${income?.id}` : "receiving_bank"}
            name="receiving_bank"
            placeholder="Ex: Revolut, Wise"
            defaultValue={income?.receiving_bank ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEditing ? `notes-${income?.id}` : "notes"}>Observacao</Label>
        <Input
          id={isEditing ? `notes-${income?.id}` : "notes"}
          name="notes"
          placeholder="Opcional"
          defaultValue={income?.notes ?? ""}
        />
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar recebimento"}
      </Button>
    </form>
  );
}
