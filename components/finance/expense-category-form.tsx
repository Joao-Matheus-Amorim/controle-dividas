"use client";

import { useActionState } from "react";

import { createExpenseCategory, updateExpenseCategory } from "@/app/protected/configuracoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DbExpenseCategory } from "@/lib/finance/server";

const initialState: { error?: string; success?: string } = {};

type ExpenseCategoryFormProps = {
  category?: DbExpenseCategory;
  mode?: "create" | "edit";
};

export function ExpenseCategoryForm({ category, mode = "create" }: ExpenseCategoryFormProps) {
  const action = mode === "edit" ? updateExpenseCategory : createExpenseCategory;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = mode === "edit" && Boolean(category);

  return (
    <form action={formAction} className="space-y-4">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={isEditing ? `name-${category?.id}` : "name"}>Nome da categoria</Label>
          <Input
            id={isEditing ? `name-${category?.id}` : "name"}
            name="name"
            placeholder="Ex: Esporte, Viagem"
            defaultValue={category?.name ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={isEditing ? `description-${category?.id}` : "description"}>Descricao</Label>
          <Input
            id={isEditing ? `description-${category?.id}` : "description"}
            name="description"
            placeholder="Opcional"
            defaultValue={category?.description ?? ""}
          />
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar categoria"}
      </Button>
    </form>
  );
}
