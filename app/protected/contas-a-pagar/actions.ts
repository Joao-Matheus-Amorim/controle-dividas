"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { PayableBillFormState } from "@/lib/finance/server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function createPayableBill(
  _prevState: PayableBillFormState,
  formData: FormData,
): Promise<PayableBillFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "");
  const responsibleMemberId = String(formData.get("responsible_member_id") ?? "");
  const status = String(formData.get("status") ?? "pendente");
  const bankUsed = String(formData.get("bank_used") ?? "").trim();
  const recurrence = String(formData.get("recurrence") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    return { error: "Informe o nome da conta." };
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return { error: "Informe um valor valido." };
  }

  if (!dueDate) {
    return { error: "Informe a data de vencimento." };
  }

  if (!["pago", "pendente", "atrasado"].includes(status)) {
    return { error: "Status invalido." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("payable_bills").insert({
    owner_id: ownerId,
    name,
    category: category || null,
    amount,
    due_date: dueDate,
    responsible_member_id: responsibleMemberId || null,
    status,
    bank_used: bankUsed || null,
    recurrence: recurrence || null,
    notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/contas-a-pagar");
  revalidatePath("/protected");

  return { success: "Conta cadastrada com sucesso." };
}

export async function updatePayableBillStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "pendente");

  if (!id || !["pago", "pendente", "atrasado"].includes(status)) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("payable_bills")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/contas-a-pagar");
  revalidatePath("/protected");
}

export async function deletePayableBill(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("payable_bills")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/contas-a-pagar");
  revalidatePath("/protected");
}
