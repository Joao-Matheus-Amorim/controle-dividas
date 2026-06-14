"use client";

import { useActionState, useState } from "react";

import { createPayableBill, updatePayableBill } from "@/app/protected/contas-a-pagar/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import {
  financeFieldClass,
  financeFormClass,
  financeGridFourClass,
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

type PayableBillFormProps = {
  members: DbFamilyMember[];
  bill?: DbPayableBill;
  mode?: "create" | "edit";
};

export function PayableBillForm({ members, bill, mode = "create" }: PayableBillFormProps) {
  const action = mode === "edit" ? updatePayableBill : createPayableBill;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [billType, setBillType] = useState<PayableBillType>(bill?.bill_type ?? "avulsa");
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(bill);

  return (
    <form action={formAction} className={financeFormClass}>
      {bill ? <input type="hidden" name="id" value={bill.id} /> : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Tipo de conta</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="cursor-pointer rounded-2xl border border-white/10 bg-[#080810]/60 p-3 transition has-[:checked]:border-[#8b72f8]/60 has-[:checked]:bg-[#8b72f8]/10">
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

          <label className="cursor-pointer rounded-2xl border border-white/10 bg-[#080810]/60 p-3 transition has-[:checked]:border-[#8b72f8]/60 has-[:checked]:bg-[#8b72f8]/10">
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

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `name-${bill?.id}` : "name"}>Nome da conta/divida</Label>
          <Input
            id={isEditing ? `name-${bill?.id}` : "name"}
            name="name"
            placeholder={billType === "fixa" ? "Ex: Aluguel" : "Ex: Boleto eventual"}
            defaultValue={bill?.name ?? ""}
            required
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
          />
        </div>

        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `due_date-${bill?.id}` : "due_date"}>Vencimento</Label>
          <Input
            id={isEditing ? `due_date-${bill?.id}` : "due_date"}
            name="due_date"
            type="date"
            defaultValue={bill?.due_date ?? today}
            required
          />
        </div>
      </div>

      <div className={financeGridFourClass}>
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `responsible_member_id-${bill?.id}` : "responsible_member_id"}>Responsavel</Label>
          <select
            id={isEditing ? `responsible_member_id-${bill?.id}` : "responsible_member_id"}
            name="responsible_member_id"
            defaultValue={bill?.responsible_member_id ?? ""}
            className={financeNativeSelectClass}
          >
            <option value="">Sem responsavel</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
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
          />
          {billType === "fixa" ? (
            <p className="text-xs text-white/35">Nesta fase, conta fixa nasce como mensal. Depois evoluiremos para recorrencia personalizada.</p>
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
