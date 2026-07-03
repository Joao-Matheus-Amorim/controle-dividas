"use client";

import { useActionState, useEffect, useState } from "react";

import { createExpense, updateExpense } from "@/app/protected/gastos/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { AssistedDraftReviewBoundary } from "@/components/finance/assisted-draft-review-boundary";
import { Button } from "@/components/ui/button";
import { CurrencyCodeInput } from "@/components/finance/currency-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinanceDateField } from "@/components/finance/finance-date-field";
import {
  financeAutomaticMemberClass,
  financeChoiceGroupClass,
  financeChoiceOptionClass,
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeGridThreeClass,
  financeGridTwoClass,
  financeHelperTextClass,
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
  draftData?: Record<string, unknown>;
  onSuccess?: () => void;
};

export function ExpenseForm({
  members,
  categories,
  bankAccounts = [],
  expense,
  mode = "create",
  defaultMemberId,
  draftData,
  onSuccess,
}: ExpenseFormProps) {
  const action = mode === "edit" ? updateExpense : createExpense;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(expense);
  const initialMemberId = expense?.family_member_id ?? defaultMemberId ?? (draftData?.memberId as string) ?? "";
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftApplied, setDraftApplied] = useState(false);
  const [categoryId, setCategoryId] = useState(
    expense?.category_id ?? (draftData?.categoryId as string) ?? "",
  );
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ?? (draftData?.date as string) ?? today,
  );
  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : (draftData?.amount ? String(draftData.amount) : ""),
  );
  const [description, setDescription] = useState(
    expense?.description ?? (draftData?.description as string) ?? "",
  );
  const [purchaseLocation, setPurchaseLocation] = useState(
    expense?.purchase_location ?? (draftData?.purchaseLocation as string) ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    expense?.payment_method ?? (draftData?.paymentMethod as string) ?? "dinheiro",
  );
  const [bankId, setBankId] = useState(
    (draftData?.bankId as string) ?? "",
  );
  const [cashCurrency, setCashCurrency] = useState(
    expense?.currency ?? (draftData?.currency as string) ?? "",
  );
  const [notes, setNotes] = useState(
    expense?.notes ?? (draftData?.notes as string) ?? "",
  );
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

  const selectedBankId = memberBankAccounts.some((account) => account.id === bankId)
    ? bankId
    : "";
  const selectedBankCurrency = memberBankAccounts.find((account) => account.id === selectedBankId)?.currency ?? "";
  const selectedExpenseCurrency = selectedBankCurrency || cashCurrency;

  function applyDraftSuggestion() {
    const suggestion = buildExpenseDraftSuggestion(
      draftPrompt,
      categories,
      memberBankAccounts,
      today,
    );

    setCategoryId(suggestion.categoryId);
    setExpenseDate(suggestion.expenseDate);
    setBankId(suggestion.bankId);
    setAmount(suggestion.amount);
    setDescription(suggestion.description);
    setPurchaseLocation(suggestion.purchaseLocation);
    setPaymentMethod(suggestion.paymentMethod);
    setNotes(suggestion.notes);
    setDraftApplied(true);
  }

  return (
    <form action={formAction} className={financeFormClass}>
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      {!isEditing ? (
        <AssistedDraftReviewBoundary
          value={draftPrompt}
          applied={draftApplied}
          description="Descreva o gasto e revise os campos antes de cadastrar."
          placeholder="Ex: Comprei 2kg de carne no Carrefour por 23,50 no cartao ontem"
          onValueChange={(value) => {
            setDraftPrompt(value);
            setDraftApplied(false);
          }}
          onSuggest={applyDraftSuggestion}
        />
      ) : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `family_member_id-${expense?.id}` : "family_member_id"}>Pessoa responsavel</Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="family_member_id" value={automaticMember.id} />
              <div className={financeAutomaticMemberClass}>
                <p className="font-semibold">{automaticMember.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Responsavel definido automaticamente pelo seu acesso.</p>
              </div>
            </>
          ) : (
            <select
              id={isEditing ? `family_member_id-${expense?.id}` : "family_member_id"}
              name="family_member_id"
              defaultValue={initialMemberId}
              onChange={(event) => {
                setSelectedMemberId(event.target.value);
                setBankId("");
              }}
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
            required
          >
            <option value="">Selecione uma categoria</option>
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
          <Label htmlFor={isEditing ? `amount-${expense?.id}` : "amount"}>
            {isEditing ? `Valor em ${selectedExpenseCurrency}` : "Valor"}
          </Label>
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

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `currency-preview-${expense?.id}` : "currency-preview"}>Moeda</Label>
          <CurrencyCodeInput
            id={isEditing ? `currency-preview-${expense?.id}` : "currency-preview"}
            name="currency"
            value={selectedExpenseCurrency}
            onChange={(event) => setCashCurrency(event.target.value)}
            readOnly={paymentMethod === "conta"}
            className={financeInputClass}
          />
          {paymentMethod === "conta" ? (
            <p className={financeHelperTextClass}>A moeda vem do banco selecionado.</p>
          ) : (
            <p className={financeHelperTextClass}>Informe a moeda do gasto em dinheiro.</p>
          )}
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

      <div className={`${financeChoiceGroupClass} ${financeGridThreeClass}`}>
        <div className="md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ff-subtle-foreground">Forma de pagamento</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <label className={financeChoiceOptionClass}>
              <input
                type="radio"
                name="payment_method"
                value="dinheiro"
                checked={paymentMethod === "dinheiro"}
                onChange={() => setPaymentMethod("dinheiro")}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-foreground">Dinheiro</span>
              <span className="mt-1 block text-xs leading-5 text-ff-subtle-foreground">Pagamento em dinheiro vivo. Use uma carteira Dinheiro cadastrada em Bancos.</span>
            </label>
            <label className={financeChoiceOptionClass}>
              <input
                type="radio"
                name="payment_method"
                value="conta"
                checked={paymentMethod === "conta"}
                onChange={() => setPaymentMethod("conta")}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-foreground">Conta / cartao</span>
              <span className="mt-1 block text-xs leading-5 text-ff-subtle-foreground">Pagamento via conta bancaria ou cartao. Exige selecao de banco.</span>
            </label>
          </div>
          {isEditing && paymentMethod !== "dinheiro" && paymentMethod !== "conta" && (
            <p className="mt-2 text-xs text-ff-subtle-foreground">
              Forma atual: <strong>{paymentMethod}</strong>. Selecione acima para alterar.
            </p>
          )}
        </div>
      </div>

      <div className={financeGridThreeClass}>
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
            <Label htmlFor="bank_id">
              {paymentMethod === "dinheiro" ? "Carteira usada (obrigatorio)" : "Banco usado (obrigatorio)"}
            </Label>
            <select
              id="bank_id"
              name="bank_id"
              value={selectedBankId}
              onChange={(event) => setBankId(event.target.value)}
              required
              className={financeNativeSelectClass}
            >
              <option value="">
                {paymentMethod === "dinheiro" ? "Selecione a carteira Dinheiro" : "Selecione um banco"}
              </option>
              {memberBankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.account_type ?? "Conta"}
                </option>
              ))}
            </select>
            {paymentMethod === "conta" ? (
              <p className={financeHelperTextClass}>
                Selecione o banco usado para gerar a movimentacao financeira automaticamente.
              </p>
            ) : (
              <p className={financeHelperTextClass}>
                Dinheiro vivo tambem movimenta o saldo familiar quando voce seleciona uma carteira Dinheiro cadastrada.
              </p>
            )}
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
