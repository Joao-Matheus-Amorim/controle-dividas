"use client";

import { useActionState } from "react";

import { createPayableBill } from "@/app/protected/contas-a-pagar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DbFamilyMember, PayableBillFormState } from "@/lib/finance/server";

const initialState: PayableBillFormState = {};

const categories = [
  "Aluguel",
  "Escola",
  "Internet",
  "Energia",
  "Agua",
  "Mercado",
  "Cartao",
  "Transporte",
  "Casa",
  "Outros",
];

export function PayableBillForm({ members }: { members: DbFamilyMember[] }) {
  const [state, formAction, isPending] = useActionState(createPayableBill, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da conta</Label>
          <Input id="name" name="name" placeholder="Ex: Aluguel" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <select
            id="category"
            name="category"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor em euro</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="120.00" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Vencimento</Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={today} required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="responsible_member_id">Responsavel</Label>
          <select
            id="responsible_member_id"
            name="responsible_member_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sem responsavel</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="pendente"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_used">Banco utilizado</Label>
          <Input id="bank_used" name="bank_used" placeholder="Ex: Revolut, Wise" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recurrence">Recorrencia</Label>
          <Input id="recurrence" name="recurrence" placeholder="Ex: mensal" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observacao</Label>
        <Input id="notes" name="notes" placeholder="Opcional" />
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar conta"}
      </Button>
    </form>
  );
}
