"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { PayableBillFormState, PayableBillType } from "@/lib/finance/server";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

const payableBillTypes: PayableBillType[] = ["avulsa", "fixa"];
const payableBillStatuses = ["pago", "pendente", "atrasado"] as const;

export type PayableBillActionState = {
  error?: string;
  success?: string;
};

async function recordPayableBillAuditEvent({
  organizationId,
  action,
  billId,
  metadata,
}: {
  organizationId: string;
  action: "finance.payable.status.update" | "finance.payable.delete";
  billId: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "payable_bill",
    targetId: billId,
    outcome: "success",
    metadata,
  });
}

async function assertResponsibleMemberBelongsToOrganization(
  ownerId: string,
  organizationId: string,
  responsibleMemberId: string,
) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", responsibleMemberId)
    .eq("owner_id", ownerId)
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
    .select("id, owner_id, responsible_member_id, status")
    .eq("id", billId)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!bill?.responsible_member_id) {
    throw new Error("Conta nao encontrada ou sem responsavel vinculado.");
  }

  await assertResponsibleMemberBelongsToOrganization(
    profile.owner_id,
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
      profile.owner_id,
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

  const { error } = await supabase.from("payable_bills").insert({
    owner_id: profile.owner_id,
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
  });

  if (error) {
    return { error: error.message };
  }

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

    if (String(bill.responsible_member_id) !== input.responsibleMemberId) {
      await assertResponsibleMemberBelongsToOrganization(
        profile.owner_id,
        organization.id,
        input.responsibleMemberId,
      );
      await assertCanAccessMember("CONTAS_A_PAGAR", "can_edit", input.responsibleMemberId);
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("payable_bills")
      .update({
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
      })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (String(bill.status) !== input.status) {
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

    revalidateOrganizationPaths(["/protected/contas-a-pagar", "/protected"], organization.slug);

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

  if (!id) {
    return { error: "Conta nao encontrada." };
  }

  if (!payableBillStatuses.includes(status as (typeof payableBillStatuses)[number])) {
    return { error: "Status invalido." };
  }

  try {
    const { profile, organization, bill } = await assertCanManagePayableBill(id, "can_edit");
    const supabase = await createClient();

    const { error } = await supabase
      .from("payable_bills")
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

    await recordPayableBillAuditEvent({
      organizationId: organization.id,
      action: "finance.payable.status.update",
      billId: id,
      metadata: {
        next_status: status,
        responsible_member_id: String(bill.responsible_member_id),
      },
    });

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
    const supabase = await createClient();

    const { error } = await supabase
      .from("payable_bills")
      .delete()
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
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
