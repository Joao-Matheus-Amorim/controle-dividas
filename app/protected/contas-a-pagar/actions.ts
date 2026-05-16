"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { PayableBillFormState, PayableBillType } from "@/lib/finance/server";
import { createClient } from "@/lib/supabase/server";

const payableBillTypes: PayableBillType[] = ["avulsa", "fixa"];
const payableBillStatuses = ["pago", "pendente", "atrasado"] as const;

async function assertCanManagePayableBill(
  billId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: bill, error } = await supabase
    .from("payable_bills")
    .select("id, owner_id, responsible_member_id")
    .eq("id", billId)
    .eq("owner_id", profile.owner_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!bill?.responsible_member_id) {
    throw new Error("Conta nao encontrada ou sem responsavel vinculado.");
  }

  await assertCanAccessMember("CONTAS_A_PAGAR", action, String(bill.responsible_member_id));

  return {
    profile,
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
  const rawRecurrence = String(formData.get("recurrence") ?? "").trim();
  const recurrence = billType === "fixa" ? rawRecurrence || "mensal" : "";
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

  try {
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

  revalidatePath("/protected/contas-a-pagar");
  revalidatePath("/protected");

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
    const { profile, bill } = await assertCanManagePayableBill(id, "can_edit");

    if (String(bill.responsible_member_id) !== input.responsibleMemberId) {
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
      })
      .eq("id", id)
      .eq("owner_id", profile.owner_id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/protected/contas-a-pagar");
    revalidatePath("/protected");

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

export async function updatePayableBillStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "pendente");

  if (!id || !payableBillStatuses.includes(status as (typeof payableBillStatuses)[number])) {
    return;
  }

  try {
    const { profile } = await assertCanManagePayableBill(id, "can_edit");
    const supabase = await createClient();

    await supabase
      .from("payable_bills")
      .update({ status })
      .eq("id", id)
      .eq("owner_id", profile.owner_id);

    revalidatePath("/protected/contas-a-pagar");
    revalidatePath("/protected");
  } catch {
    return;
  }
}

export async function deletePayableBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  try {
    const { profile } = await assertCanManagePayableBill(id, "can_delete");
    const supabase = await createClient();

    await supabase
      .from("payable_bills")
      .delete()
      .eq("id", id)
      .eq("owner_id", profile.owner_id);

    revalidatePath("/protected/contas-a-pagar");
    revalidatePath("/protected");
  } catch {
    return;
  }
}
