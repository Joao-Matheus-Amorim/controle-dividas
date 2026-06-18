"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, FileText, Landmark, UserRound, WalletCards } from "lucide-react";

import { createReceivableIncome, updateReceivableIncome } from "@/app/protected/contas-a-receber/actions";
import { AppActionFeedback } from "@/components/app/app-action-feedback";
import { FinanceDateField } from "@/components/finance/finance-date-field";
import {
  financeAutomaticMemberClass,
  financeFieldClass,
  financeFormClass,
  financeGridThreeClass,
  financeGridTwoClass,
  financeHelperTextClass,
  financeInputClass,
  financeNativeSelectClass,
  financeSelectTriggerClass,
  financeSubmitBarClass,
  financeSubmitButtonClass,
} from "@/components/finance/finance-form-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DbBankAccount,
  DbFamilyMember,
  DbReceivableIncome,
  DbReceivableIncomeSource,
  ReceivableIncomeFormState,
} from "@/lib/finance/types";

const initialState: ReceivableIncomeFormState = {};

const incomeSources = [
  "Renda fixa",
  "Salário",
  "Comissão",
  "Freelance / serviços",
  "Vendas",
  "Bônus",
  "Aluguel recebido",
  "Reembolso",
  "Mesada / apoio financeiro",
  "Outros",
];

const customIncomeSourceValue = "__custom_income_source__";

const legacyIncomeSourceLabels: Record<string, string> = {
  Salario: "Salário",
  Comissao: "Comissão",
  "Empresa / servicos": "Freelance / serviços",
};

type FormSectionProps = {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: ReactNode;
};

function FormSection({ icon: Icon, title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-3.5 sm:p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#8b72f8]/25 bg-[#8b72f8]/12 text-[#c6bbff]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

type ReceivableIncomeFormProps = {
  members: DbFamilyMember[];
  sources?: DbReceivableIncomeSource[];
  bankAccounts?: DbBankAccount[];
  income?: DbReceivableIncome;
  mode?: "create" | "edit";
  defaultMemberId?: string;
  onSuccess?: () => void;
};

export function ReceivableIncomeForm({
  members,
  sources = [],
  bankAccounts = [],
  income,
  mode = "create",
  defaultMemberId,
  onSuccess,
}: ReceivableIncomeFormProps) {
  const action = mode === "edit" ? updateReceivableIncome : createReceivableIncome;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const today = new Date().toISOString().slice(0, 10);
  const isEditing = mode === "edit" && Boolean(income);
  const initialMemberId = income?.receiver_member_id ?? defaultMemberId ?? "";
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId);
  const sourceNames = sources.map((source) => source.name);
  const automaticMember = !isEditing && defaultMemberId
    ? members.find((member) => member.id === defaultMemberId) ?? null
    : null;
  const selectedSource = income?.source ?? "";
  const [sourceValue, setSourceValue] = useState(
    selectedSource && !sourceNames.includes(selectedSource) ? customIncomeSourceValue : selectedSource,
  );
  const isCustomSource = sourceValue === customIncomeSourceValue;
  const memberBankAccounts = bankAccounts.filter(
    (account) => account.family_member_id === selectedMemberId,
  );
  const selectedReceivingBank = income?.receiving_bank ?? "";
  const keepsLegacyReceivingBank =
    isEditing &&
    selectedReceivingBank &&
    !memberBankAccounts.some((account) => account.bank_name === selectedReceivingBank);

  useEffect(() => {
    if (state.success) {
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className={financeFormClass}>
      {income ? <input type="hidden" name="id" value={income.id} /> : null}

      <FormSection
        icon={UserRound}
        title="Quem recebe"
        description="Escolha a pessoa vinculada a esta entrada para manter permissões e relatórios corretos."
      >
        <div className={financeGridTwoClass}>
          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}>Pessoa que vai receber</Label>
            {automaticMember ? (
              <>
                <input type="hidden" name="receiver_member_id" value={automaticMember.id} />
                <div className={financeAutomaticMemberClass}>
                  <p className="font-semibold">{automaticMember.name}</p>
                  <p className="mt-1 text-xs text-white/45">Pessoa definida automaticamente pelo seu acesso.</p>
                </div>
              </>
            ) : (
              <select
                id={isEditing ? `receiver_member_id-${income?.id}` : "receiver_member_id"}
                name="receiver_member_id"
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
        </div>
      </FormSection>

      <FormSection
        icon={WalletCards}
        title="Origem e valor"
        description="Registre o tipo de entrada, valor previsto e recorrência em uma única etapa."
      >
        <div className={financeGridThreeClass}>
          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `source-${income?.id}` : "source"}>Entrada de dinheiro</Label>
            <select
              id={isEditing ? `source-${income?.id}` : "source"}
              name={isCustomSource ? "source_preset" : "source"}
              value={sourceValue}
              onChange={(event) => setSourceValue(event.target.value)}
              required={!isCustomSource}
              className={financeNativeSelectClass}
            >
              <option value="">Selecione a origem</option>
              {isCustomSource ? (
                <option value={customIncomeSourceValue}>{selectedSource}</option>
              ) : null}
              {sourceNames.map((source) => (
                <option key={source} value={source}>
                  {legacyIncomeSourceLabels[source] ?? source}
                </option>
              ))}
            </select>
            {isCustomSource ? (
              <>
                <Label className="sr-only" htmlFor={isEditing ? `source-custom-${income?.id}` : "source-custom"}>
                  Nova origem
                </Label>
                <Input
                  id={isEditing ? `source-custom-${income?.id}` : "source-custom"}
                  name="source"
                  placeholder="Digite a origem"
                  defaultValue={selectedSource && !sourceNames.includes(selectedSource) ? selectedSource : ""}
                  required
                  className={financeInputClass}
                />
              </>
            ) : null}
            <p className={financeHelperTextClass}>
              Ex: salário, comissão, venda, aluguel recebido ou reembolso.
            </p>
          </div>

          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `income_type-${income?.id}` : "income_type"}>Tipo de renda</Label>
            <Select name="income_type" defaultValue={income?.income_type ?? "fixa"}>
              <SelectTrigger id={isEditing ? `income_type-${income?.id}` : "income_type"} className={financeSelectTriggerClass}>
                <SelectValue placeholder="Tipo de renda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixa">Fixa / recorrente</SelectItem>
                <SelectItem value="variavel">Variável / pontual</SelectItem>
              </SelectContent>
            </Select>
            <p className={financeHelperTextClass}>
              Use fixa para entradas recorrentes e variável para comissões, vendas e extras.
            </p>
          </div>

          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `payment_origin-${income?.id}` : "payment_origin"}>
              De onde/de quem vem o pagamento
            </Label>
            <Input
              id={isEditing ? `payment_origin-${income?.id}` : "payment_origin"}
              name="payment_origin"
              placeholder="Ex: Empresa, cliente, pessoa ou plataforma"
              defaultValue={income?.payment_origin ?? ""}
              className={financeInputClass}
            />
            <p className={financeHelperTextClass}>
              Identifique o pagador ou a origem concreta do dinheiro.
            </p>
          </div>

          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `amount-${income?.id}` : "amount"}>Valor em euro</Label>
            <div className="relative">
              <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" aria-hidden="true" />
              <Input
                id={isEditing ? `amount-${income?.id}` : "amount"}
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="1450.00"
                defaultValue={income ? String(income.amount) : ""}
                required
                className={`${financeInputClass} pl-10`}
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={CalendarDays}
        title="Previsão"
        description="Informe quando o dinheiro deve entrar e acompanhe o status do recebimento."
      >
        <div className={financeGridThreeClass}>
          <div className={financeFieldClass}>
            <FinanceDateField
              id={isEditing ? `expected_date-${income?.id}` : "expected_date"}
              name="expected_date"
              defaultValue={income?.expected_date ?? today}
              label="Data prevista"
              required
            />
          </div>

          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `status-${income?.id}` : "status"}>Status</Label>
            <Select name="status" defaultValue={income?.status ?? "previsto"}>
              <SelectTrigger id={isEditing ? `status-${income?.id}` : "status"} className={financeSelectTriggerClass}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previsto">Previsto</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={financeFieldClass}>
            <Label htmlFor={isEditing ? `receiving_bank-${income?.id}` : "receiving_bank"}>Banco de recebimento</Label>
            <div className="relative">
              <Landmark className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" aria-hidden="true" />
              <select
                id={isEditing ? `receiving_bank-${income?.id}` : "receiving_bank"}
                name="receiving_bank"
                defaultValue={income?.receiving_bank ?? ""}
                className={`${financeNativeSelectClass} pl-10`}
              >
                <option value="">Selecione um banco cadastrado</option>
                {keepsLegacyReceivingBank ? (
                  <option value={selectedReceivingBank}>{selectedReceivingBank}</option>
                ) : null}
                {memberBankAccounts.map((account) => (
                  <option key={account.id} value={account.bank_name}>
                    {account.bank_name} - {account.account_type ?? "Conta"}
                  </option>
                ))}
              </select>
            </div>
            <p className={financeHelperTextClass}>
              Use somente bancos cadastrados na aba Bancos para a pessoa recebedora.
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection
        icon={FileText}
        title="Detalhes"
        description="Use a observação para identificar campanhas, clientes, parcelas ou combinados."
      >
        <div className={financeFieldClass}>
          <Label htmlFor={isEditing ? `notes-${income?.id}` : "notes"}>Observação</Label>
          <Input
            id={isEditing ? `notes-${income?.id}` : "notes"}
            name="notes"
            placeholder="Opcional"
            defaultValue={income?.notes ?? ""}
            className={financeInputClass}
          />
        </div>
      </FormSection>

      <AppActionFeedback error={state.error} success={state.success} />

      <div className={financeSubmitBarClass}>
        <Button type="submit" disabled={isPending} className={financeSubmitButtonClass}>
          {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar entrada"}
        </Button>
      </div>
    </form>
  );
}
