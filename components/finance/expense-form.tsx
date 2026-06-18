"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { createExpense, updateExpense } from "@/app/protected/gastos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinanceDateField } from "@/components/finance/finance-date-field";
import {
  financeAutomaticMemberClass,
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeGridThreeClass,
  financeGridTwoClass,
  financeInputClass,
  financeNativeSelectClass,
  financeSubmitBarClass,
  financeSubmitButtonClass,
} from "@/components/finance/finance-form-ui";
import { buildExpenseCategoryLabelMap } from "@/lib/finance/category-labels";
import { buildExpenseDraftSuggestion } from "@/lib/finance/expense-draft";
import type {
  DbBankAccount,
  DbExpense,
  DbExpenseCategory,
  DbFamilyMember,
  ExpenseFormState,
} from "@/lib/finance/types";

const initialState: ExpenseFormState = {};

type ExpenseFormProps = {
  members: DbFamilyMember[];
  categories: DbExpenseCategory[];
  bankAccounts?: DbBankAccount[];
  expense?: DbExpense;
  mode?: "create" | "edit";
  defaultMemberId?: string;
  onSuccess?: () => void;
};

export function ExpenseForm({
  members,
  categories,
  bankAccounts = [],
  expense,
  mode = "create",
  defaultMemberId,
  onSuccess,
}: ExpenseFormProps) {
  const action = mode === "edit" ? updateExpense : createExpense;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(expense);
  const initialMemberId = expense?.family_member_id ?? defaultMemberId ?? "";
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftApplied, setDraftApplied] = useState(false);
  const [categoryId, setCategoryId] = useState(expense?.category_id ?? "");
  const [expenseDate, setExpenseDate] = useState(expense?.expense_date ?? today);
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [purchaseLocation, setPurchaseLocation] = useState(expense?.purchase_location ?? "");
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;
  const memberBankAccounts = bankAccounts.filter(
    (account) => account.family_member_id === selectedMemberId,
  );
  const selectedBankOrCard = expense?.bank_or_card ?? "";
  const keepsLegacyBankOrCard =
    isEditing &&
    selectedBankOrCard &&
    !memberBankAccounts.some((account) => account.bank_name === selectedBankOrCard);
  const categoryLabels = buildExpenseCategoryLabelMap(categories);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  function applyDraftSuggestion() {
    const suggestion = buildExpenseDraftSuggestion(draftPrompt, categories, today);

    if (suggestion.categoryId) setCategoryId(suggestion.categoryId);
    if (suggestion.expenseDate) setExpenseDate(suggestion.expenseDate);
    if (suggestion.amount) setAmount(suggestion.amount);
    if (suggestion.description) setDescription(suggestion.description);
    if (suggestion.purchaseLocation) setPurchaseLocation(suggestion.purchaseLocation);
    if (suggestion.paymentMethod) setPaymentMethod(suggestion.paymentMethod);
    if (suggestion.notes) setNotes(suggestion.notes);
    setDraftApplied(true);
  }

  return (
    <form action={formAction} className={financeFormClass}>
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      {!isEditing ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Rascunho assistido</p>
              <p className="mt-1 text-sm text-white/45">Descreva o gasto e revise os campos antes de cadastrar.</p>
            </div>
            {draftApplied ? (
              <span className="rounded-full bg-[#8b72f8]/15 px-3 py-1 text-xs font-semibold text-[#c9bfff]">
                rascunho aplicado
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={draftPrompt}
              onChange={(event) => {
                setDraftPrompt(event.target.value);
                setDraftApplied(false);
              }}
              placeholder="Ex: Comprei 2kg de carne no Carrefour por 23,50 no cartao ontem"
              className={financeInputClass}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-11 rounded-2xl px-4"
              onClick={applyDraftSuggestion}
              disabled={!draftPrompt.trim()}
            >
              <Sparkles className="h-4 w-4" />
              Sugerir
            </Button>
          </div>
        </div>
      ) : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `family_member_id-${expense?.id}` : "family_member_id"}>Pessoa responsavel</Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="family_member_id" value={automaticMember.id} />
              <div className={financeAutomaticMemberClass}>
                <p className="font-semibold">{automaticMember.name}</p>
                <p className="mt-1 text-xs text-white/45">Responsavel definido automaticamente pelo seu acesso.</p>
              </div>
            </>
          ) : (
            <select
              id={isEditing ? `family_member_id-${expense?.id}` : "family_member_id"}
              name="family_member_id"
              defaultValue={initialMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
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
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={financeNativeSelectClass}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {categoryLabels.get(category.id) ?? category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={financeFieldClass}>
          <FinanceDateField
            id={isEditing ? `expense_date-${expense?.id}` : "expense_date"}
            name="expense_date"
            defaultValue={expenseDate}
            value={expenseDate}
            onValueChange={setExpenseDate}
            label="Data"
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
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className={financeInputClass}
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
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            className={financeInputClass}
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `purchase_location-${expense?.id}` : "purchase_location"}>Local da compra</Label>
          <Input
            id={isEditing ? `purchase_location-${expense?.id}` : "purchase_location"}
            name="purchase_location"
            placeholder="Ex: Cafeteria X"
            value={purchaseLocation}
            onChange={(event) => setPurchaseLocation(event.target.value)}
            className={financeInputClass}
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
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className={financeInputClass}
          />
        </div>

        {isEditing ? (
          <div className={financeFieldClass}>
            <Label htmlFor={`bank_or_card-${expense?.id}`}>Banco ou cartao</Label>
            <select
              id={`bank_or_card-${expense?.id}`}
              name="bank_or_card"
              defaultValue={expense?.bank_or_card ?? ""}
              className={financeNativeSelectClass}
            >
              <option value="">Selecione um banco cadastrado</option>
              {keepsLegacyBankOrCard ? (
                <option value={selectedBankOrCard}>{selectedBankOrCard}</option>
              ) : null}
              {memberBankAccounts.map((account) => (
                <option key={account.id} value={account.bank_name}>
                  {account.bank_name} - {account.account_type ?? "Conta"}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={financeFieldClass}>
            <Label htmlFor="bank_id">Banco usado</Label>
            <select
              id="bank_id"
              name="bank_id"
              required
              className={financeNativeSelectClass}
            >
              <option value="">Selecione o banco</option>
              {memberBankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_type ?? "Conta"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `notes-${expense?.id}` : "notes"}>Observacao</Label>
          <Input
            id={isEditing ? `notes-${expense?.id}` : "notes"}
            name="notes"
            placeholder="Opcional"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={financeInputClass}
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
