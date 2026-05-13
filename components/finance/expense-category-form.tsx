"use client";

import { useActionState } from "react";

import { createExpenseCategory } from "@/app/protected/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: { error?: string; success?: string } = {};

export function ExpenseCategoryForm() {
  const [state, formAction, isPending] = useActionState(
    createExpenseCategory,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da categoria</Label>
          <Input id="name" name="name" placeholder="Ex: Esporte, Viagem" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descricao</Label>
          <Input id="description" name="description" placeholder="Opcional" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Cadastrar categoria"}
      </Button>
    </form>
  );
}
