"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createPayableBill, updatePayableBill } from "@/app/protected/contas-a-pagar/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { FinanceDateField } from "@/components/finance/finance-date-field";
import {
  financeAutomaticMemberClass,
  financeChoiceGroupClass,
  financeChoiceOptionClass,
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
  financeHelperTextClass,
  financeInputClass,
  financeNativeSelectClass,
  financeSubmitBarClass,
  financeSubmitButtonClass,
} from "@/components/finance/finance-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  DbBankAccount,
  DbExpenseCategory,
  DbFamilyMember,
  DbPayableBill,
  PayableBillFormState,
  PayableBillType,
} from "@/lib/finance/types";

const initialState: PayableBillFormState = {};

const customCategoryValue = "__custom_category__";

type FixedBillAudience = "family" | "person";

type PayableBillFormProps = {
  members: DbFamilyMember[];
  categories?: DbExpenseCategory[];
  bankAccounts?: DbBankAccount[];
  bill?: DbPayableBill;
  mode?: "create" | "edit";
  defaultMemberId?: string;
  onSuccess?: () => void;
};

export function PayableBillForm({
  members,
  categories = [],
  bankAccounts = [],
  bill,
  mode = "create",
  defaultMemberId,
  onSuccess,
}: PayableBillFormProps) {
  const action = mode === "edit" ? updatePayableBill : createPayableBill;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const recordedTimezoneRef = useRef<HTMLInputElement>(null);
  const [billType, setBillType] = useState<PayableBillType>(bill?.bill_type ?? "avulsa");
  const [fixedBillAudience, setFixedBillAudience] = useState<FixedBillAudience>("family");
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(bill);
  const initialMemberId = bill?.responsible_member_id ?? defaultMemberId ?? "";
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const categoryNames = categories.map((category) => category.name);
  const selectedCategory = bill?.category ?? "";
  const [categoryValue, setCategoryValue] = useState(
    selectedCategory && !categoryNames.includes(selectedCategory) ? customCategoryValue : selectedCategory,
  );
  const isCustomCategory = categoryValue === customCategoryValue;
  const isFixedBill = billType === "fixa";
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;
  const memberBankAccounts = bankAccounts.filter(
    (account) => account.family_member_id === selectedMemberId,
  );
  const selectedBankUsed = bill?.bank_used ?? "";
  const keepsLegacyBankUsed =
    isEditing &&
    selectedBankUsed &&
    !memberBankAccounts.some((account) => account.bank_name === selectedBankUsed);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  function captureRecordedTimezone() {
    if (recordedTimezoneRef.current) {
      recordedTimezoneRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }

  return (
    <form action={formAction} onSubmit={captureRecordedTimezone} className={financeFormClass}>
      {bill ? <input type="hidden" name="id" value={bill.id} /> : null}
      <input ref={recordedTimezoneRef} type="hidden" name="recorded_timezone" defaultValue="" />

      <div className={financeChoiceGroupClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Tipo de conta</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className={financeChoiceOptionClass}>
            <input
              type="radio"
              name="bill_type"
              value="avulsa"
              checked={billType === "avulsa"}
              onChange={() => setBillType("avulsa")}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-white">Conta avulsa</span>
            <span className="mt-1 block text-xs leading-5 text-white/35">Pagamento pontual, boleto eventual ou divida sem repeticao.</span>
          </label>

          <label className={financeChoiceOptionClass}>
            <input
              type="radio"
              name="bill_type"
              value="fixa"
              checked={billType === "fixa"}
              onChange={() => setBillType("fixa")}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-white">Conta fixa</span>
            <span className="mt-1 block text-xs leading-5 text-white/35">Conta recorrente, inicialmente mensal e futuramente personalizavel.</span>
          </label>
        </div>
      </div>

      {isFixedBill ? (
        <div className={financeChoiceGroupClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Direcionamento da conta fixa</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <label className={financeChoiceOptionClass}>
              <input
                type="radio"
                name="fixed_bill_audience"
                value="family"
                checked={fixedBillAudience === "family"}
                onChange={() => setFixedBillAudience("family")}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-white">Família inteira</span>
              <span className="mt-1 block text-xs leading-5 text-white/35">
                Conta compartilhada da casa. Escolha abaixo quem será o responsável financeiro pelo pagamento.
              </span>
            </label>

            <label className={financeChoiceOptionClass}>
              <input
                type="radio"
                name="fixed_bill_audience"
                value="person"
                checked={fixedBillAudience === "person"}
                onChange={() => setFixedBillAudience("person")}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-white">Personalizada por pessoa</span>
              <span className="mt-1 block text-xs leading-5 text-white/35">
                Use quando a conta fixa pertence a uma pessoa específica, como mensalidade ou plano individual.
              </span>
            </label>
          </div>
        </div>
      ) : null}

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `name-${bill?.id}` : "name"}>Nome da conta/divida</Label>
          <Input
            id={isEditing ? `name-${bill?.id}` : "name"}
            name="name"
            placeholder={billType === "fixa" ? "Ex: Aluguel" : "Ex: Boleto eventual"}
            defaultValue={bill?.name ?? ""}
            required
            className={financeInputClass}
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `category-${bill?.id}` : "category"}>Categoria</Label>
          <select
            id={isEditing ? `category-${bill?.id}` : "category"}
            name={isCustomCategory ? "category_preset" : "category"}
            value={categoryValue}
            onChange={(event) => setCategoryValue(event.target.value)}
            required={!isCustomCategory}
            className={financeNativeSelectClass}
          >
            <option value="">Selecione</option>
            {categoryNames.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>
          <p className={financeHelperTextClass}>
            Use as categorias definidas em Configuracoes para padronizar custos da org.
          </p>
          {isCustomCategory ? (
            <>
              <Label className="sr-only" htmlFor={isEditing ? `category-custom-${bill?.id}` : "category-custom"}>
                Nova categoria
              </Label>
              <Input
                id={isEditing ? `category-custom-${bill?.id}` : "category-custom"}
                name="category"
                placeholder="Digite a categoria"
                defaultValue={selectedCategory && !categoryNames.includes(selectedCategory) ? selectedCategory : ""}
                required
                className={financeInputClass}
              />
            </>
          ) : null}
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `amount-${bill?.id}` : "amount"}>Valor em euro</Label>
          <Input
            id={isEditing ? `amount-${bill?.id}` : "amount"}
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="120.00"
            defaultValue={bill ? String(bill.amount) : ""}
            required
            className={financeInputClass}
          />
        </div>

        <div className={financeFieldClass}>
          <FinanceDateField
            id={isEditing ? `due_date-${bill?.id}` : "due_date"}
            name="due_date"
            defaultValue={bill?.due_date ?? today}
            label="Vencimento"
            required
          />
        </div>
      </div>

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `responsible_member_id-${bill?.id}` : "responsible_member_id"}>
            {isFixedBill && fixedBillAudience === "family" ? "Responsável financeiro" : "Responsável"}
          </Label>
          {automaticMember ? (
            <>
              <input type="hidden" name="responsible_member_id" value={automaticMember.id} />
              <div className={financeAutomaticMemberClass}>
                <p className="font-semibold">{automaticMember.name}</p>
                <p className="mt-1 text-xs text-white/45">Responsável definido automaticamente pelo seu acesso.</p>
              </div>
            </>
          ) : (
            <select
              id={isEditing ? `responsible_member_id-${bill?.id}` : "responsible_member_id"}
              name="responsible_member_id"
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
          {isFixedBill ? (
            <p className={financeHelperTextClass}>
              {fixedBillAudience === "family"
                ? "A conta fica registrada como fixa da família, com esta pessoa como responsável financeiro."
                : "A conta fixa fica personalizada para a pessoa selecionada."}
            </p>
          ) : null}
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `status-${bill?.id}` : "status"}>Status</Label>
          <select
            id={isEditing ? `status-${bill?.id}` : "status"}
            name="status"
            defaultValue={bill?.status ?? "pendente"}
            className={financeNativeSelectClass}
          >
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `bank_used-${bill?.id}` : "bank_used"}>Banco utilizado</Label>
          <select
            id={isEditing ? `bank_used-${bill?.id}` : "bank_used"}
            name="bank_used"
            defaultValue={bill?.bank_used ?? ""}
            className={financeNativeSelectClass}
          >
            <option value="">Selecione um banco cadastrado</option>
            {keepsLegacyBankUsed ? (
              <option value={selectedBankUsed}>{selectedBankUsed}</option>
            ) : null}
            {memberBankAccounts.map((account) => (
              <option key={account.id} value={account.bank_name}>
                {account.bank_name} - {account.account_type ?? "Conta"}
              </option>
            ))}
          </select>
          <p className={financeHelperTextClass}>
            Use somente bancos cadastrados na aba Bancos para a pessoa responsavel.
          </p>
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `recurrence-${bill?.id}` : "recurrence"}>Recorrencia</Label>
          <Input
            id={isEditing ? `recurrence-${bill?.id}` : "recurrence"}
            name="recurrence"
            defaultValue={billType === "fixa" ? bill?.recurrence ?? "mensal" : ""}
            placeholder={billType === "fixa" ? "mensal" : "Sem recorrencia"}
            disabled={billType === "avulsa"}
            className={financeInputClass}
          />
          {billType === "fixa" ? (
            <p className={financeHelperTextClass}>Nesta fase, conta fixa nasce como mensal. Depois evoluiremos para recorrencia personalizada.</p>
          ) : null}
        </div>
      </div>

      <div className={financeFieldClass}>
        <Label htmlFor={isEditing ? `notes-${bill?.id}` : "notes"}>Observacao</Label>
        <Input
          id={isEditing ? `notes-${bill?.id}` : "notes"}
          name="notes"
          placeholder="Opcional"
          defaultValue={bill?.notes ?? ""}
          className={financeInputClass}
        />
      </div>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={financeSubmitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending
            ? "Salvando..."
            : isEditing
              ? "Salvar alteracoes"
              : billType === "fixa"
                ? "Cadastrar conta fixa"
                : "Cadastrar conta avulsa"}
        </Button>
      </div>
    </form>
  );
}
