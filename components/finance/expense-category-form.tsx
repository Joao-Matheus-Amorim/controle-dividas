"use client";

import { useActionState } from "react";

import { createExpenseCategory, updateExpenseCategory } from "@/app/protected/configuracoes/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import {
  financeFieldClass,
  financeFormClass,
  financeGridTwoClass,
  financeInlineSubmitBarClass,
  financeInputClass,
  financeSubmitBarClass,
  financeSubmitButtonClass,
} from "@/components/finance/finance-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildExpenseCategoryLabelMap } from "@/lib/finance/category-labels";
import type { DbExpenseCategory } from "@/lib/finance/types";

const initialState: { error?: string; success?: string } = {};

type ExpenseCategoryFormProps = {
  category?: DbExpenseCategory;
  categories?: DbExpenseCategory[];
  mode?: "create" | "edit";
  submitLayout?: "inline" | "sheet";
};

export function ExpenseCategoryForm({
  category,
  categories = [],
  mode = "create",
  submitLayout = "inline",
}: ExpenseCategoryFormProps) {
  const action = mode === "edit" ? updateExpenseCategory : createExpenseCategory;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = mode === "edit" && Boolean(category);
  const submitBarClass =
    submitLayout === "sheet" ? financeSubmitBarClass : financeInlineSubmitBarClass;
  const categoryLabels = buildExpenseCategoryLabelMap(categories);
  const parentCategoryOptions = categories.filter(
    (option) => option.id !== category?.id && !option.parent_category_id,
  );

  return (
    <form action={formAction} className={financeFormClass}>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className={financeGridTwoClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `name-${category?.id}` : "name"}>Nome da categoria</Label>
          <Input
            id={isEditing ? `name-${category?.id}` : "name"}
            name="name"
            placeholder="Ex: Esporte, Viagem"
            defaultValue={category?.name ?? ""}
            required
            className={financeInputClass}
          />
        </div>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `description-${category?.id}` : "description"}>Descricao</Label>
          <Input
            id={isEditing ? `description-${category?.id}` : "description"}
            name="description"
            placeholder="Opcional"
            defaultValue={category?.description ?? ""}
            className={financeInputClass}
          />
        </div>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `parent_category_id-${category?.id}` : "parent_category_id"}>
            Categoria principal (opcional)
          </Label>
          <select
            id={isEditing ? `parent_category_id-${category?.id}` : "parent_category_id"}
            name="parent_category_id"
            defaultValue={category?.parent_category_id ?? ""}
            className={financeInputClass}
          >
            <option value="">Criar como categoria principal</option>
            {parentCategoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {categoryLabels.get(option.id) ?? option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={submitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar categoria"}
        </Button>
      </div>
    </form>
  );
}
