"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { ReceivableIncomeFormState } from "@/lib/finance/server";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

const receivableIncomeTypes = ["fixa", "variavel"] as const;
const receivableIncomeStatuses = ["previsto", "recebido", "atrasado"] as const;
const receivableDeleteRateLimit = {
  operationKey: "finance.receivable.delete",
  limit: 5,
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
  action: "finance.receivable.status.update" | "finance.receivable.delete";
  incomeId: string;
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
  ownerId: string,
  organizationId: string,
  receiverMemberId: string,
) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", receiverMemberId)
    .eq("owner_id", ownerId)
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
    .select("id, owner_id, receiver_member_id, status")
    .eq("id", incomeId)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!income?.receiver_member_id) {
    throw new Error("Recebimento nao encontrado ou sem pessoa vinculada.");
  }

  await assertReceiverMemberBelongsToOrganization(
    profile.owner_id,
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

function parseReceivableIncomeForm(formData: FormData) {
  const receiverMemberId = String(formData.get("receiver_member_id") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  const incomeType = String(formData.get("income_type") ?? "fixa");
  const amount = Number(formData.get("amount") ?? 0);
  const expectedDate = String(formData.get("expected_date") ?? "");
  const status = String(formData.get("status") ?? "previsto");
  const receivingBank = String(formData.get("receiving_bank") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    receiverMemberId,
    source,
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
      profile.owner_id,
      organization.id,
      input.receiverMemberId,
    );
    await assertCanAccessMember("CONTAS_A_RECEBER", "can_create", input.receiverMemberId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Voce nao tem permissao para cadastrar recebimento para esta pessoa.",
    };
  }

  const { error } = await supabase.from("receivable_incomes").insert({
    owner_id: profile.owner_id,
    organization_id: organization.id,
    receiver_member_id: input.receiverMemberId,
    source: input.source,
    income_type: input.incomeType,
    amount: input.amount,
    expected_date: input.expectedDate,
    status: input.status,
    receiving_bank: input.receivingBank || null,
    notes: input.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

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

    if (String(income.receiver_member_id) !== input.receiverMemberId) {
      await assertReceiverMemberBelongsToOrganization(
        profile.owner_id,
        organization.id,
        input.receiverMemberId,
      );
      await assertCanAccessMember("CONTAS_A_RECEBER", "can_edit", input.receiverMemberId);
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("receivable_incomes")
      .update({
        receiver_member_id: input.receiverMemberId,
        source: input.source,
        income_type: input.incomeType,
        amount: input.amount,
        expected_date: input.expectedDate,
        status: input.status,
        receiving_bank: input.receivingBank || null,
        notes: input.notes || null,
        organization_id: organization.id,
      })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (String(income.status) !== input.status) {
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

    revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected"], organization.slug);

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

  if (!id) {
    return { error: "Recebimento nao encontrado." };
  }

  if (!receivableIncomeStatuses.includes(status as (typeof receivableIncomeStatuses)[number])) {
    return { error: "Status invalido." };
  }

  try {
    const { profile, organization, income } = await assertCanManageReceivableIncome(id, "can_edit");
    const supabase = await createClient();

    const { error } = await supabase
      .from("receivable_incomes")
      .update({
        status,
        organization_id: organization.id,
      })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    await recordReceivableIncomeAuditEvent({
      organizationId: organization.id,
      action: "finance.receivable.status.update",
      incomeId: id,
      metadata: {
        next_status: status,
        receiver_member_id: String(income.receiver_member_id),
      },
    });

    revalidateOrganizationPaths(["/protected/contas-a-receber", "/protected"], organization.slug);

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

  if (!id) {
    return { error: "Recebimento nao encontrado." };
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
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
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
