"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { PayableBillFormState, PayableBillType } from "@/lib/finance/types";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

const payableBillTypes: PayableBillType[] = ["avulsa", "fixa"];
const payableBillStatuses = ["pago", "pendente", "atrasado"] as const;
const payableCreateRateLimit = {
  operationKey: "finance.payable.create",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};
const payableUpdateRateLimit = {
  operationKey: "finance.payable.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};
const payableDeleteRateLimit = {
  operationKey: "finance.payable.delete",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};
const payableStatusRateLimit = {
  operationKey: "finance.payable.status.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

export type PayableBillActionState = {
  error?: string;
  success?: string;
};

async function recordPayableBillAuditEvent({
  organizationId,
  action,
  billId,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action:
    | "finance.payable.create"
    | "finance.payable.update"
    | "finance.payable.status.update"
    | "finance.payable.delete";
  billId: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "payable_bill",
    targetId: billId,
    outcome,
    metadata,
  });
}

async function assertResponsibleMemberBelongsToOrganization(
  organizationId: string,
  responsibleMemberId: string,
) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", responsibleMemberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    throw new Error("Responsavel nao pertence a esta organizacao.");
  }

  return member;
}

async function assertCanManagePayableBill(
  billId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: bill, error } = await supabase
    .from("payable_bills")
    .select("id, owner_id, responsible_member_id, name, category, amount, due_date, status, bill_type, bank_used, recurrence, notes")
    .eq("id", billId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!bill?.responsible_member_id) {
    throw new Error("Conta nao encontrada ou sem responsavel vinculado.");
  }

  await assertResponsibleMemberBelongsToOrganization(
    organization.id,
    String(bill.responsible_member_id),
  );

  await assertCanAccessMember("CONTAS_A_PAGAR", action, String(bill.responsible_member_id));

  return {
    profile,
    organization,
    bill,
  };
}

async function assertMovementBankBelongsToMember(
  organizationId: string,
  bankId: string,
  responsibleMemberId: string,
) {
  if (!bankId) {
    throw new Error("Selecione o banco usado no pagamento.");
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

  if (!bank || String(bank.family_member_id ?? "") !== responsibleMemberId) {
    throw new Error("Banco selecionado nao pertence ao responsavel desta conta.");
  }

  return bank;
}

function parsePayableBillForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "");
  const responsibleMemberId = String(formData.get("responsible_member_id") ?? "");
  const status = String(formData.get("status") ?? "pendente");
  const rawBillType = String(formData.get("bill_type") ?? "avulsa");
  const billType = payableBillTypes.includes(rawBillType as PayableBillType)
    ? (rawBillType as PayableBillType)
    : "avulsa";
  const bankUsed = String(formData.get("bank_used") ?? "").trim();
  const recurrence = billType === "fixa" ? "mensal" : "";
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    name,
    category,
    amount,
    dueDate,
    responsibleMemberId,
    status,
    billType,
    bankUsed,
    recurrence,
    notes,
  };
}

function validatePayableBillInput(input: ReturnType<typeof parsePayableBillForm>): PayableBillFormState | null {
  if (!input.responsibleMemberId) {
    return { error: "Selecione o responsavel pela conta." };
  }

  if (!input.name) {
    return { error: "Informe o nome da conta." };
  }

  if (Number.isNaN(input.amount) || input.amount <= 0) {
    return { error: "Informe um valor valido." };
  }

  if (!input.dueDate) {
    return { error: "Informe a data de vencimento." };
  }

  if (!payableBillStatuses.includes(input.status as (typeof payableBillStatuses)[number])) {
    return { error: "Status invalido." };
  }

  return null;
}

function hasPayableBillWriteChanges(
  bill: Record<string, unknown>,
  input: ReturnType<typeof parsePayableBillForm>,
) {
  return (
    String(bill.name ?? "").trim() !== input.name ||
    String(bill.category ?? "").trim() !== input.category ||
    Number(bill.amount ?? 0) !== input.amount ||
    String(bill.due_date ?? "") !== input.dueDate ||
    String(bill.responsible_member_id ?? "") !== input.responsibleMemberId ||
    String(bill.bill_type ?? "avulsa") !== input.billType ||
    String(bill.bank_used ?? "").trim() !== input.bankUsed ||
    String(bill.recurrence ?? "").trim() !== input.recurrence ||
    String(bill.notes ?? "").trim() !== input.notes
  );
}

export async function createPayableBill(
  _prevState: PayableBillFormState,
  formData: FormData,
): Promise<PayableBillFormState> {
  const input = parsePayableBillForm(formData);
  const validationError = validatePayableBillInput(input);

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  try {
    await assertResponsibleMemberBelongsToOrganization(
      organization.id,
      input.responsibleMemberId,
    );
    await assertCanAccessMember("CONTAS_A_PAGAR", "can_create", input.responsibleMemberId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Voce nao tem permissao para cadastrar conta para esta pessoa.",
    };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...payableCreateRateLimit,
    actorKey: profile.id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordPayableBillAuditEvent({
      organizationId: organization.id,
      action: "finance.payable.create",
      billId: null,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        payable_created: true,
        responsible_member_id: input.responsibleMemberId,
      },
    });

    return { error: "Muitas tentativas de cadastro de conta. Tente novamente em alguns minutos." };
  }

  const { data: createdBill, error } = await supabase.from("payable_bills").insert({
    owner_id: organization.owner_auth_user_id,
    organization_id: organization.id,
    name: input.name,
    category: input.category || null,
    amount: input.amount,
    due_date: input.dueDate,
    responsible_member_id: input.responsibleMemberId,
    status: input.status,
    bill_type: input.billType,
    bank_used: input.bankUsed || null,
    recurrence: input.recurrence || null,
    notes: input.notes || null,
  }).select("id").single();

  if (error) {
    return { error: error.message };
  }

  await recordPayableBillAuditEvent({
    organizationId: organization.id,
    action: "finance.payable.create",
    billId: createdBill?.id ? String(createdBill.id) : null,
    metadata: {
      payable_created: true,
      responsible_member_id: input.responsibleMemberId,
    },
  });

  revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected"], organization.slug);

  return {
    success:
      input.billType === "fixa"
        ? "Conta fixa cadastrada com sucesso."
        : "Conta avulsa cadastrada com sucesso.",
  };
}

export async function updatePayableBill(
  _prevState: PayableBillFormState,
  formData: FormData,
): Promise<PayableBillFormState> {
  const id = String(formData.get("id") ?? "");
  const input = parsePayableBillForm(formData);
  const validationError = validatePayableBillInput(input);

  if (!id) {
    return { error: "Conta nao encontrada." };
  }

  if (validationError) {
    return validationError;
  }

  try {
    const { profile, organization, bill } = await assertCanManagePayableBill(id, "can_edit");
    const billChanged = hasPayableBillWriteChanges(bill, input);

    if (String(bill.responsible_member_id) !== input.responsibleMemberId) {
      await assertResponsibleMemberBelongsToOrganization(
        organization.id,
        input.responsibleMemberId,
      );
      await assertCanAccessMember("CONTAS_A_PAGAR", "can_edit", input.responsibleMemberId);
    }

    const statusChanged = String(bill.status) !== input.status;
    const payableStatusRateLimitInput = {
      ...payableStatusRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
      targetKey: id,
    };
    const payableUpdateRateLimitInput = {
      ...payableUpdateRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
      targetKey: id,
    };

    if (statusChanged && billChanged) {
      const statusRateLimit = checkSensitiveOperationRateLimit({
        ...payableStatusRateLimitInput,
        consume: false,
      });

      if (!statusRateLimit.allowed) {
        await recordPayableBillAuditEvent({
          organizationId: organization.id,
          action: "finance.payable.status.update",
          billId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            responsible_member_id: String(bill.responsible_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
      }

      const updateRateLimit = checkSensitiveOperationRateLimit({
        ...payableUpdateRateLimitInput,
        consume: false,
      });

      if (!updateRateLimit.allowed) {
        await recordPayableBillAuditEvent({
          organizationId: organization.id,
          action: "finance.payable.update",
          billId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            payable_changed: true,
            responsible_member_id: input.responsibleMemberId,
          },
        });

        return { error: "Muitas tentativas de alteracao de conta. Tente novamente em alguns minutos." };
      }

      checkSensitiveOperationRateLimit(payableStatusRateLimitInput);
      checkSensitiveOperationRateLimit(payableUpdateRateLimitInput);
    } else if (statusChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...payableStatusRateLimitInput,
      });

      if (!rateLimit.allowed) {
        await recordPayableBillAuditEvent({
          organizationId: organization.id,
          action: "finance.payable.status.update",
          billId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            responsible_member_id: String(bill.responsible_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
      }
    } else if (billChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...payableUpdateRateLimitInput,
      });

      if (!rateLimit.allowed) {
        await recordPayableBillAuditEvent({
          organizationId: organization.id,
          action: "finance.payable.update",
          billId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            payable_changed: true,
            responsible_member_id: input.responsibleMemberId,
          },
        });

        return { error: "Muitas tentativas de alteracao de conta. Tente novamente em alguns minutos." };
      }
    }

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("payable_bills")
      .update(
        {
          name: input.name,
          category: input.category || null,
          amount: input.amount,
          due_date: input.dueDate,
          responsible_member_id: input.responsibleMemberId,
          status: input.status,
          bill_type: input.billType,
          bank_used: input.bankUsed || null,
          recurrence: input.recurrence || null,
          notes: input.notes || null,
          organization_id: organization.id,
        },
        { count: "exact" },
      )
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Conta nao encontrada." };
    }

    if (billChanged) {
      await recordPayableBillAuditEvent({
        organizationId: organization.id,
        action: "finance.payable.update",
        billId: id,
        metadata: {
          payable_changed: true,
          responsible_member_id: input.responsibleMemberId,
        },
      });
    }

    if (statusChanged) {
      await recordPayableBillAuditEvent({
        organizationId: organization.id,
        action: "finance.payable.status.update",
        billId: id,
        metadata: {
          previous_status: String(bill.status),
          next_status: input.status,
          responsible_member_id: input.responsibleMemberId,
        },
      });
    }

    revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected/bancos", "/protected"], organization.slug);

    return { success: "Conta atualizada com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar esta conta.",
    };
  }
}

export async function updatePayableBillStatus(
  _prevState: PayableBillActionState,
  formData: FormData,
): Promise<PayableBillActionState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "pendente");
  const bankId = String(formData.get("bank_id") ?? "");
  const recordedTimezone = String(formData.get("recorded_timezone") ?? "").trim() || null;

  if (!id) {
    return { error: "Conta nao encontrada." };
  }

  if (!payableBillStatuses.includes(status as (typeof payableBillStatuses)[number])) {
    return { error: "Status invalido." };
  }

  try {
    const { profile, organization, bill } = await assertCanManagePayableBill(id, "can_edit");
    const transitionToPaid = String(bill.status) !== "pago" && status === "pago";
    if (transitionToPaid) {
      await assertMovementBankBelongsToMember(
        organization.id,
        bankId,
        String(bill.responsible_member_id),
      );
    }

    if (String(bill.status) !== status) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...payableStatusRateLimit,
        actorKey: profile.id,
        organizationId: organization.id,
        targetKey: id,
      });

      if (!rateLimit.allowed) {
        await recordPayableBillAuditEvent({
          organizationId: organization.id,
          action: "finance.payable.status.update",
          billId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            responsible_member_id: String(bill.responsible_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
      }
    }

    const supabase = await createClient();

    if (transitionToPaid) {
      const { error } = await supabase.rpc("mark_payable_bill_paid_with_movement", {
        target_organization_id: organization.id,
        target_payable_bill_id: id,
        target_bank_id: bankId,
        target_profile_id: profile.id,
        target_recorded_timezone: recordedTimezone,
      });

      if (error) {
        return { error: error.message };
      }
    } else {
      const { error, count } = await supabase
        .from("payable_bills")
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
        return { error: "Conta nao encontrada." };
      }
    }

    if (String(bill.status) !== status) {
      await recordPayableBillAuditEvent({
        organizationId: organization.id,
        action: "finance.payable.status.update",
        billId: id,
        metadata: {
          next_status: status,
          responsible_member_id: String(bill.responsible_member_id),
        },
      });
    }

    revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected"], organization.slug);

    return { success: "Status atualizado com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o status desta conta.",
    };
  }
}

export async function deletePayableBill(
  _prevState: PayableBillActionState,
  formData: FormData,
): Promise<PayableBillActionState> {
  const id = String(formData.get("id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");

  if (!id) {
    return { error: "Conta nao encontrada." };
  }

  if (confirmation !== "confirmado") {
    return { error: "Confirme a exclusao antes de continuar." };
  }

  try {
    const { profile, organization, bill } = await assertCanManagePayableBill(id, "can_delete");
    const rateLimit = checkSensitiveOperationRateLimit({
      ...payableDeleteRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
    });

    if (!rateLimit.allowed) {
      await recordPayableBillAuditEvent({
        organizationId: organization.id,
        action: "finance.payable.delete",
        billId: id,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          responsible_member_id: String(bill.responsible_member_id),
        },
      });

      return { error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos." };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("payable_bills")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Conta nao encontrada." };
    }

    await recordPayableBillAuditEvent({
      organizationId: organization.id,
      action: "finance.payable.delete",
      billId: id,
      metadata: {
        responsible_member_id: String(bill.responsible_member_id),
      },
    });

    revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected"], organization.slug);

    return { success: "Conta excluida com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir esta conta.",
    };
  }
}
