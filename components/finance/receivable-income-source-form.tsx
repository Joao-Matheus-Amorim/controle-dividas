"use client";

import { useActionState } from "react";

import {
  createReceivableIncomeSource,
  updateReceivableIncomeSource,
} from "@/app/protected/configuracoes/actions";
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
import type { DbReceivableIncomeSource } from "@/lib/finance/types";

const initialState: { error?: string; success?: string } = {};

type ReceivableIncomeSourceFormProps = {
  source?: DbReceivableIncomeSource;
  mode?: "create" | "edit";
  submitLayout?: "inline" | "sheet";
};

export function ReceivableIncomeSourceForm({
  source,
  mode = "create",
  submitLayout = "inline",
}: ReceivableIncomeSourceFormProps) {
  const action = mode === "edit" ? updateReceivableIncomeSource : createReceivableIncomeSource;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isEditing = mode === "edit" && Boolean(source);
  const submitBarClass =
    submitLayout === "sheet" ? financeSubmitBarClass : financeInlineSubmitBarClass;

  return (
    <form action={formAction} className={financeFormClass}>
      {source ? <input type="hidden" name="id" value={source.id} /> : null}

      <div className={financeGridTwoClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `source-name-${source?.id}` : "source-name"}>
            Nome da origem
          </Label>
          <Input
            id={isEditing ? `source-name-${source?.id}` : "source-name"}
            name="name"
            placeholder="Ex: Salario, Vendas, Reembolso"
            defaultValue={source?.name ?? ""}
            required
            className={financeInputClass}
          />
        </div>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `source-description-${source?.id}` : "source-description"}>
            Descricao
          </Label>
          <Input
            id={isEditing ? `source-description-${source?.id}` : "source-description"}
            name="description"
            placeholder="Opcional"
            defaultValue={source?.description ?? ""}
            className={financeInputClass}
          />
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={submitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar origem"}
        </Button>
      </div>
    </form>
  );
}
