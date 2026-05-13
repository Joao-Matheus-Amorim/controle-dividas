"use client";

import { useActionState } from "react";

import { createExpense } from "@/app/protected/gastos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DbExpenseCategory,
  DbFamilyMember,
  ExpenseFormState,
} from "@/lib/finance/server";

const initialState: ExpenseFormState = {};

export function ExpenseForm({
  members,
  categories,
}: {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
}) {
  const [state, formAction, isPending] = useActionState(createExpense, initialState);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="family_member_id">Pessoa responsavel</Label>
          <select
            id="family_member_id"
            name="family_member_id"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecione</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria</Label>
          <select
            id="category_id"
            name="category_id"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense_date">Data</Label>
          <Input id="expense_date" name="expense_date" type="date" defaultValue={today} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Valor em euro</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="3.50" required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description">Descricao</Label>
          <Input id="description" name="description" placeholder="Ex: Cafe, mercado, passagem" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_location">Local da compra</Label>
          <Input id="purchase_location" name="purchase_location" placeholder="Ex: Cafeteria X" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="payment_method">Forma de pagamento</Label>
          <Input id="payment_method" name="payment_method" placeholder="Cartao, dinheiro, transferencia" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank_or_card">Banco ou cartao</Label>
          <Input id="bank_or_card" name="bank_or_card" placeholder="Ex: Revolut, Wise" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observacao</Label>
          <Input id="notes" name="notes" placeholder="Opcional" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar gasto"}
      </Button>
    </form>
  );
}
