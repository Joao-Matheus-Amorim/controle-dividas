"use client";

import { useActionState, useState } from "react";

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
import type { DbFamilyMember, DbPayableBill, PayableBillFormState, PayableBillType } from "@/lib/finance/types";

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

type FixedBillAudience = "family" | "person";

type PayableBillFormProps = {
  members: DbFamilyMember[];
  bill?: DbPayableBill;
  mode?: "create" | "edit";
  defaultMemberId?: string;
};

export function PayableBillForm({
  members,
  bill,
  mode = "create",
  defaultMemberId,
}: PayableBillFormProps) {
  const action = mode === "edit" ? updatePayableBill : createPayableBill;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [billType, setBillType] = useState<PayableBillType>(bill?.bill_type ?? "avulsa");
  const [fixedBillAudience, setFixedBillAudience] = useState<FixedBillAudience>("family");
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(bill);
  const isFixedBill = billType === "fixa";
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;

  return (
    <form action={formAction} className={financeFormClass}>
      {bill ? <input type="hidden" name="id" value={bill.id} /> : null}

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
            name="category"
            defaultValue={bill?.category ?? ""}
            className={financeNativeSelectClass}
          >
            <option value="">Selecione</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
              defaultValue={bill?.responsible_member_id ?? defaultMemberId ?? ""}
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
          <Input
            id={isEditing ? `bank_used-${bill?.id}` : "bank_used"}
            name="bank_used"
            placeholder="Ex: Revolut, Wise"
            defaultValue={bill?.bank_used ?? ""}
            className={financeInputClass}
          />
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
