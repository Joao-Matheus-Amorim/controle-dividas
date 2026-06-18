"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import { isFinancialMovementReferenceError } from "@/lib/finance/delete-guard-errors";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { ReceivableIncomeFormState } from "@/lib/finance/types";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

const receivableIncomeTypes = ["fixa", "variavel"] as const;
const receivableIncomeStatuses = ["previsto", "recebido", "atrasado"] as const;
const receivableCreateRateLimit = {
  operationKey: "finance.receivable.create",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};
const receivableUpdateRateLimit = {
  operationKey: "finance.receivable.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};
const receivableDeleteRateLimit = {
  operationKey: "finance.receivable.delete",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};
const receivableStatusRateLimit = {
  operationKey: "finance.receivable.status.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

export type ReceivableIncomeActionState = {
  error?: string;
  success?: string;
};

async function recordReceivableIncomeAuditEvent({
  organizationId,
  action,
  incomeId,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action:
    | "finance.receivable.create"
    | "finance.receivable.update"
    | "finance.receivable.status.update"
    | "finance.receivable.delete";
  incomeId: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "receivable_income",
    targetId: incomeId,
    outcome,
    metadata,
  });
}

async function assertReceiverMemberBelongsToOrganization(
  organizationId: string,
  receiverMemberId: string,
) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", receiverMemberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    throw new Error("Pessoa recebedora nao pertence a esta organizacao.");
  }

  return member;
}

async function assertCanManageReceivableIncome(
  incomeId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: income, error } = await supabase
    .from("receivable_incomes")
    .select("id, owner_id, receiver_member_id, source, payment_origin, income_type, amount, expected_date, status, receiving_bank, notes")
    .eq("id", incomeId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!income?.receiver_member_id) {
    throw new Error("Recebimento nao encontrado ou sem pessoa vinculada.");
  }

  await assertReceiverMemberBelongsToOrganization(
    organization.id,
    String(income.receiver_member_id),
  );

  await assertCanAccessMember("CONTAS_A_RECEBER", action, String(income.receiver_member_id));

  return {
    profile,
    organization,
    income,
  };
}

async function assertMovementBankBelongsToMember(
  organizationId: string,
  bankId: string,
  receiverMemberId: string,
) {
  if (!bankId) {
    throw new Error("Selecione o banco que recebeu o dinheiro.");
  }

  const supabase = await createClient();
  const { data: bank, error } = await supabase
    .from("banks")
    .select("id, organization_id, family_member_id, currency")
    .eq("id", bankId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!bank || String(bank.family_member_id ?? "") !== receiverMemberId) {
    throw new Error("Banco selecionado nao pertence a pessoa recebedora.");
  }

  return bank;
}

async function assertBankNameBelongsToReceiverMember(
  organizationId: string,
  bankName: string,
  receiverMemberId: string,
) {
  if (!bankName) {
    return null;
  }

  const supabase = await createClient();
  const { data: banks, error } = await supabase
    .from("banks")
    .select("id")
    .eq("bank_name", bankName)
    .eq("family_member_id", receiverMemberId)
    .eq("organization_id", organizationId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!banks?.length) {
    throw new Error("Selecione um banco cadastrado para a pessoa recebedora.");
  }

  return banks[0];
}

function parseReceivableIncomeForm(formData: FormData) {
  const receiverMemberId = String(formData.get("receiver_member_id") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  const paymentOrigin = String(formData.get("payment_origin") ?? "").trim();
  const incomeType = String(formData.get("income_type") ?? "fixa");
  const amount = Number(formData.get("amount") ?? 0);
  const expectedDate = String(formData.get("expected_date") ?? "");
  const status = String(formData.get("status") ?? "previsto");
  const receivingBank = String(formData.get("receiving_bank") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    receiverMemberId,
    source,
    paymentOrigin,
    incomeType,
    amount,
    expectedDate,
    status,
    receivingBank,
    notes,
  };
}

function validateReceivableIncomeInput(
  input: ReturnType<typeof parseReceivableIncomeForm>,
): ReceivableIncomeFormState | null {
  if (!input.receiverMemberId) {
    return { error: "Selecione a pessoa que ira receber." };
  }

  if (!input.source) {
    return { error: "Informe a origem do dinheiro." };
  }

  if (!receivableIncomeTypes.includes(input.incomeType as (typeof receivableIncomeTypes)[number])) {
    return { error: "Tipo de renda invalido." };
  }

  if (Number.isNaN(input.amount) || input.amount <= 0) {
    return { error: "Informe um valor valido." };
  }

  if (!input.expectedDate) {
    return { error: "Informe a data prevista." };
  }

  if (!receivableIncomeStatuses.includes(input.status as (typeof receivableIncomeStatuses)[number])) {
    return { error: "Status invalido." };
  }

  return null;
}

function hasReceivableIncomeWriteChanges(
  income: Record<string, unknown>,
  input: ReturnType<typeof parseReceivableIncomeForm>,
) {
  return (
    String(income.receiver_member_id ?? "") !== input.receiverMemberId ||
    String(income.source ?? "").trim() !== input.source ||
    String(income.payment_origin ?? "").trim() !== input.paymentOrigin ||
    String(income.income_type ?? "fixa") !== input.incomeType ||
    Number(income.amount ?? 0) !== input.amount ||
    String(income.expected_date ?? "") !== input.expectedDate ||
    String(income.receiving_bank ?? "").trim() !== input.receivingBank ||
    String(income.notes ?? "").trim() !== input.notes
  );
}

export async function createReceivableIncome(
  _prevState: ReceivableIncomeFormState,
  formData: FormData,
): Promise<ReceivableIncomeFormState> {
  const input = parseReceivableIncomeForm(formData);
  const validationError = validateReceivableIncomeInput(input);

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  try {
    await assertReceiverMemberBelongsToOrganization(
      organization.id,
      input.receiverMemberId,
    );
    await assertCanAccessMember("CONTAS_A_RECEBER", "can_create", input.receiverMemberId);
    await assertBankNameBelongsToReceiverMember(
      organization.id,
      input.receivingBank,
      input.receiverMemberId,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Voce nao tem permissao para cadastrar recebimento para esta pessoa.",
    };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...receivableCreateRateLimit,
    actorKey: profile.id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordReceivableIncomeAuditEvent({
      organizationId: organization.id,
      action: "finance.receivable.create",
      incomeId: null,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        receivable_created: true,
        receiver_member_id: input.receiverMemberId,
      },
    });

    return { error: "Muitas tentativas de cadastro de recebimento. Tente novamente em alguns minutos." };
  }

  const { data: createdIncome, error } = await supabase.from("receivable_incomes").insert({
    owner_id: organization.owner_auth_user_id,
    organization_id: organization.id,
    receiver_member_id: input.receiverMemberId,
    source: input.source,
    payment_origin: input.paymentOrigin || null,
    income_type: input.incomeType,
    amount: input.amount,
    expected_date: input.expectedDate,
    status: input.status,
    receiving_bank: input.receivingBank || null,
    notes: input.notes || null,
  }).select("id").single();

  if (error) {
    return { error: error.message };
  }

  await recordReceivableIncomeAuditEvent({
    organizationId: organization.id,
    action: "finance.receivable.create",
    incomeId: createdIncome?.id ? String(createdIncome.id) : null,
    metadata: {
      receivable_created: true,
      receiver_member_id: input.receiverMemberId,
    },
  });

  revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected"], organization.slug);

  return { success: "Conta a receber cadastrada com sucesso." };
}

export async function updateReceivableIncome(
  _prevState: ReceivableIncomeFormState,
  formData: FormData,
): Promise<ReceivableIncomeFormState> {
  const id = String(formData.get("id") ?? "");
  const input = parseReceivableIncomeForm(formData);
  const validationError = validateReceivableIncomeInput(input);

  if (!id) {
    return { error: "Recebimento nao encontrado." };
  }

  if (validationError) {
    return validationError;
  }

  try {
    const { profile, organization, income } = await assertCanManageReceivableIncome(id, "can_edit");
    const incomeChanged = hasReceivableIncomeWriteChanges(income, input);
    const receiverMemberChanged = String(income.receiver_member_id) !== input.receiverMemberId;

    if (receiverMemberChanged) {
      await assertReceiverMemberBelongsToOrganization(
        organization.id,
        input.receiverMemberId,
      );
      await assertCanAccessMember("CONTAS_A_RECEBER", "can_edit", input.receiverMemberId);
    }

    const existingReceivingBank = String(income.receiving_bank ?? "").trim();
    if (input.receivingBank && (input.receivingBank !== existingReceivingBank || receiverMemberChanged)) {
      await assertBankNameBelongsToReceiverMember(
        organization.id,
        input.receivingBank,
        input.receiverMemberId,
      );
    }

    const statusChanged = String(income.status) !== input.status;
    const receivableStatusRateLimitInput = {
      ...receivableStatusRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
      targetKey: id,
    };
    const receivableUpdateRateLimitInput = {
      ...receivableUpdateRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
      targetKey: id,
    };

    if (statusChanged && incomeChanged) {
      const statusRateLimit = checkSensitiveOperationRateLimit({
        ...receivableStatusRateLimitInput,
        consume: false,
      });

      if (!statusRateLimit.allowed) {
        await recordReceivableIncomeAuditEvent({
          organizationId: organization.id,
          action: "finance.receivable.status.update",
          incomeId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            receiver_member_id: String(income.receiver_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
      }

      const updateRateLimit = checkSensitiveOperationRateLimit({
        ...receivableUpdateRateLimitInput,
        consume: false,
      });

      if (!updateRateLimit.allowed) {
        await recordReceivableIncomeAuditEvent({
          organizationId: organization.id,
          action: "finance.receivable.update",
          incomeId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            receivable_changed: true,
            receiver_member_id: input.receiverMemberId,
          },
        });

        return { error: "Muitas tentativas de alteracao de recebimento. Tente novamente em alguns minutos." };
      }

      checkSensitiveOperationRateLimit(receivableStatusRateLimitInput);
      checkSensitiveOperationRateLimit(receivableUpdateRateLimitInput);
    } else if (statusChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...receivableStatusRateLimitInput,
      });

      if (!rateLimit.allowed) {
        await recordReceivableIncomeAuditEvent({
          organizationId: organization.id,
          action: "finance.receivable.status.update",
          incomeId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            receiver_member_id: String(income.receiver_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
      }
    } else if (incomeChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...receivableUpdateRateLimitInput,
      });

      if (!rateLimit.allowed) {
        await recordReceivableIncomeAuditEvent({
          organizationId: organization.id,
          action: "finance.receivable.update",
          incomeId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            receivable_changed: true,
            receiver_member_id: input.receiverMemberId,
          },
        });

        return { error: "Muitas tentativas de alteracao de recebimento. Tente novamente em alguns minutos." };
      }
    }

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("receivable_incomes")
      .update({
        receiver_member_id: input.receiverMemberId,
        source: input.source,
        payment_origin: input.paymentOrigin || null,
        income_type: input.incomeType,
        amount: input.amount,
        expected_date: input.expectedDate,
        status: input.status,
        receiving_bank: input.receivingBank || null,
        notes: input.notes || null,
        organization_id: organization.id,
      }, { count: "exact" })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Recebimento nao encontrado." };
    }

    if (incomeChanged) {
      await recordReceivableIncomeAuditEvent({
        organizationId: organization.id,
        action: "finance.receivable.update",
        incomeId: id,
        metadata: {
          receivable_changed: true,
          receiver_member_id: input.receiverMemberId,
        },
      });
    }

    if (statusChanged) {
      await recordReceivableIncomeAuditEvent({
        organizationId: organization.id,
        action: "finance.receivable.status.update",
        incomeId: id,
        metadata: {
          previous_status: String(income.status),
          next_status: input.status,
          receiver_member_id: input.receiverMemberId,
        },
      });
    }

    revalidateOrganizationPaths([
      "/protected/contas-a-receber",
      "/protected/movimentacoes",
      "/protected/bancos",
      "/protected",
    ], organization.slug);

    return { success: "Recebimento atualizado com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar este recebimento.",
    };
  }
}

export async function updateReceivableIncomeStatus(
  formData: FormData,
): Promise<ReceivableIncomeActionState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "previsto");
  const bankId = String(formData.get("bank_id") ?? "");
  const recordedTimezone = String(formData.get("recorded_timezone") ?? "").trim() || null;

  if (!id) {
    return { error: "Recebimento nao encontrado." };
  }

  if (!receivableIncomeStatuses.includes(status as (typeof receivableIncomeStatuses)[number])) {
    return { error: "Status invalido." };
  }

  try {
    const { profile, organization, income } = await assertCanManageReceivableIncome(id, "can_edit");
    if (String(income.status) === "recebido" && status !== "recebido") {
      return { error: "Recebimento ja possui movimentacao. Estorno sera tratado pelo fluxo de movimentacoes." };
    }

    const transitionToReceived = String(income.status) !== "recebido" && status === "recebido";
    if (transitionToReceived) {
      await assertMovementBankBelongsToMember(
        organization.id,
        bankId,
        String(income.receiver_member_id),
      );
    }

    if (String(income.status) !== status) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...receivableStatusRateLimit,
        actorKey: profile.id,
        organizationId: organization.id,
        targetKey: id,
      });

      if (!rateLimit.allowed) {
        await recordReceivableIncomeAuditEvent({
          organizationId: organization.id,
          action: "finance.receivable.status.update",
          incomeId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            receiver_member_id: String(income.receiver_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
      }
    }

    const supabase = await createClient();

    if (transitionToReceived) {
      const { error } = await supabase.rpc("mark_receivable_income_received_with_movement", {
        target_organization_id: organization.id,
        target_receivable_income_id: id,
        target_bank_id: bankId,
        target_profile_id: profile.id,
        target_recorded_timezone: recordedTimezone,
      });

      if (error) {
        return { error: error.message };
      }
    } else {
      const { error, count } = await supabase
        .from("receivable_incomes")
        .update({
          status,
          organization_id: organization.id,
        }, { count: "exact" })
        .eq("id", id)
        .eq("organization_id", organization.id);

      if (error) {
        return { error: error.message };
      }

      if (count !== 1) {
        return { error: "Recebimento nao encontrado." };
      }
    }

    if (String(income.status) !== status) {
      await recordReceivableIncomeAuditEvent({
        organizationId: organization.id,
        action: "finance.receivable.status.update",
        incomeId: id,
        metadata: {
          next_status: status,
          receiver_member_id: String(income.receiver_member_id),
        },
      });
    }

    revalidateOrganizationPaths([
      "/protected/contas-a-receber",
      "/protected/movimentacoes",
      "/protected/bancos",
      "/protected",
    ], organization.slug);

    return { success: "Status atualizado com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o status deste recebimento.",
    };
  }
}

export async function updateReceivableIncomeStatusWithState(
  _prevState: ReceivableIncomeActionState,
  formData: FormData,
): Promise<ReceivableIncomeActionState> {
  return updateReceivableIncomeStatus(formData);
}

export async function updateReceivableIncomeStatusFormAction(formData: FormData): Promise<void> {
  await updateReceivableIncomeStatus(formData);
}

export async function deleteReceivableIncome(
  formData: FormData,
): Promise<ReceivableIncomeActionState> {
  const id = String(formData.get("id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");

  if (!id) {
    return { error: "Recebimento nao encontrado." };
  }

  if (confirmation !== "confirmado") {
    return { error: "Confirme a exclusao antes de continuar." };
  }

  try {
    const { profile, organization, income } = await assertCanManageReceivableIncome(id, "can_delete");
    const rateLimit = checkSensitiveOperationRateLimit({
      ...receivableDeleteRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
    });

    if (!rateLimit.allowed) {
      await recordReceivableIncomeAuditEvent({
        organizationId: organization.id,
        action: "finance.receivable.delete",
        incomeId: id,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          receiver_member_id: String(income.receiver_member_id),
        },
      });

      return { error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos." };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("receivable_incomes")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) {
      if (isFinancialMovementReferenceError(error)) {
        return { error: "Recebimento com movimentacao financeira nao pode ser excluido sem estorno." };
      }

      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Recebimento nao encontrado." };
    }

    await recordReceivableIncomeAuditEvent({
      organizationId: organization.id,
      action: "finance.receivable.delete",
      incomeId: id,
      metadata: {
        receiver_member_id: String(income.receiver_member_id),
      },
    });

    revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected"], organization.slug);

    return { success: "Recebimento excluido com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir este recebimento.",
    };
  }
}

export async function deleteReceivableIncomeWithState(
  _prevState: ReceivableIncomeActionState,
  formData: FormData,
): Promise<ReceivableIncomeActionState> {
  return deleteReceivableIncome(formData);
}

export async function deleteReceivableIncomeFormAction(formData: FormData): Promise<void> {
  await deleteReceivableIncome(formData);
}
