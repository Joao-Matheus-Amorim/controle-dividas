"use client";

import { useActionState } from "react";

import { createExpense, updateExpense } from "@/app/protected/gastos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeGridThreeClass,
  financeGridTwoClass,
  financeNativeSelectClass,
  financeSubmitBarClass,
  financeSubmitButtonClass,
} from "@/components/finance/finance-form-ui";
import type {
  DbExpense,
  DbExpenseCategory,
  DbFamilyMember,
  ExpenseFormState,
} from "@/lib/finance/types";

const initialState: ExpenseFormState = {};

type ExpenseFormProps = {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  expense?: DbExpense;
  mode?: "create" | "edit";
  defaultMemberId?: string;
};

export function ExpenseForm({
  members,
  categories,
  expense,
  mode = "create",
  defaultMemberId,
}: ExpenseFormProps) {
  const action = mode === "edit" ? updateExpense : createExpense;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(expense);
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;

  return (
    <form action={formAction} className={financeFormClass}>
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `family_member_id-${expense?.id}` : "family_member_id"}>Pessoa responsavel</Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="family_member_id" value={automaticMember.id} />
              <div className="min-h-11 rounded-2xl border border-white/10 bg-[#080810]/70 px-4 py-3 text-sm text-white">
                <p className="font-semibold">{automaticMember.name}</p>
                <p className="mt-1 text-xs text-white/45">Responsavel definido automaticamente pelo seu acesso.</p>
              </div>
            </>
          ) : (
            <select
              id={isEditing ? `family_member_id-${expense?.id}` : "family_member_id"}
              name="family_member_id"
              defaultValue={expense?.family_member_id ?? defaultMemberId ?? ""}
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
          <Label htmlFor={isEditing ? `category_id-${expense?.id}` : "category_id"}>Categoria</Label>
          <select
            id={isEditing ? `category_id-${expense?.id}` : "category_id"}
            name="category_id"
            defaultValue={expense?.category_id ?? ""}
            className={financeNativeSelectClass}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `expense_date-${expense?.id}` : "expense_date"}>Data</Label>
          <Input
            id={isEditing ? `expense_date-${expense?.id}` : "expense_date"}
            name="expense_date"
            type="date"
            defaultValue={expense?.expense_date ?? today}
            required
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `amount-${expense?.id}` : "amount"}>Valor em euro</Label>
          <Input
            id={isEditing ? `amount-${expense?.id}` : "amount"}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="3.50"
            defaultValue={expense ? String(expense.amount) : ""}
            required
          />
        </div>
      </div>

      <div className={financeGridTwoClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `description-${expense?.id}` : "description"}>Descricao</Label>
          <Input
            id={isEditing ? `description-${expense?.id}` : "description"}
            name="description"
            placeholder="Ex: Cafe, mercado, passagem"
            defaultValue={expense?.description ?? ""}
            required
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `purchase_location-${expense?.id}` : "purchase_location"}>Local da compra</Label>
          <Input
            id={isEditing ? `purchase_location-${expense?.id}` : "purchase_location"}
            name="purchase_location"
            placeholder="Ex: Cafeteria X"
            defaultValue={expense?.purchase_location ?? ""}
          />
        </div>
      </div>

      <div className={financeGridThreeClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `payment_method-${expense?.id}` : "payment_method"}>Forma de pagamento</Label>
          <Input
            id={isEditing ? `payment_method-${expense?.id}` : "payment_method"}
            name="payment_method"
            placeholder="Cartao, dinheiro, transferencia"
            defaultValue={expense?.payment_method ?? ""}
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `bank_or_card-${expense?.id}` : "bank_or_card"}>Banco ou cartao</Label>
          <Input
            id={isEditing ? `bank_or_card-${expense?.id}` : "bank_or_card"}
            name="bank_or_card"
            placeholder="Ex: Revolut, Wise"
            defaultValue={expense?.bank_or_card ?? ""}
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `notes-${expense?.id}` : "notes"}>Observacao</Label>
          <Input
            id={isEditing ? `notes-${expense?.id}` : "notes"}
            name="notes"
            placeholder="Opcional"
            defaultValue={expense?.notes ?? ""}
          />
        </div>
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={financeSubmitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Cadastrar gasto"}
        </Button>
      </div>
    </form>
  );
}
