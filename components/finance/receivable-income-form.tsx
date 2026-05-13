"use client";

import { useActionState } from "react";

import { createReceivableIncome } from "@/app/protected/contas-a-receber/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DbFamilyMember, ReceivableIncomeFormState } from "@/lib/finance/server";

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

export function ReceivableIncomeForm({ members }: { members: DbFamilyMember[] }) {
  const [state, formAction, isPending] = useActionState(createReceivableIncome, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="receiver_member_id">Pessoa que vai receber</Label>
          <select
            id="receiver_member_id"
            name="receiver_member_id"
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
          <Label htmlFor="source">Origem do dinheiro</Label>
          <select
            id="source"
            name="source"
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
          <Label htmlFor="income_type">Tipo de renda</Label>
          <select
            id="income_type"
            name="income_type"
            defaultValue="fixa"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="fixa">Fixa</option>
            <option value="variavel">Variavel</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor em euro</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="1450.00" required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="expected_date">Data prevista</Label>
          <Input id="expected_date" name="expected_date" type="date" defaultValue={today} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="previsto"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="previsto">Previsto</option>
            <option value="recebido">Recebido</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiving_bank">Banco de recebimento</Label>
          <Input id="receiving_bank" name="receiving_bank" placeholder="Ex: Revolut, Wise" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observacao</Label>
        <Input id="notes" name="notes" placeholder="Opcional" />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar recebimento"}
      </Button>
    </form>
  );
}
