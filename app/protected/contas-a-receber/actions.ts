"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ReceivableIncomeFormState } from "@/lib/finance/server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function createReceivableIncome(
  _prevState: ReceivableIncomeFormState,
  formData: FormData,
): Promise<ReceivableIncomeFormState> {
  const receiverMemberId = String(formData.get("receiver_member_id") ?? "");
  const source = String(formData.get("source") ?? "").trim();
  const incomeType = String(formData.get("income_type") ?? "fixa");
  const amount = Number(formData.get("amount") ?? 0);
  const expectedDate = String(formData.get("expected_date") ?? "");
  const status = String(formData.get("status") ?? "previsto");
  const receivingBank = String(formData.get("receiving_bank") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!source) {
    return { error: "Informe a origem do dinheiro." };
  }

  if (!["fixa", "variavel"].includes(incomeType)) {
    return { error: "Tipo de renda invalido." };
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return { error: "Informe um valor valido." };
  }

  if (!expectedDate) {
    return { error: "Informe a data prevista." };
  }

  if (!["previsto", "recebido", "atrasado"].includes(status)) {
    return { error: "Status invalido." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("receivable_incomes").insert({
    owner_id: ownerId,
    receiver_member_id: receiverMemberId || null,
    source,
    income_type: incomeType,
    amount,
    expected_date: expectedDate,
    status,
    receiving_bank: receivingBank || null,
    notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/contas-a-receber");
  revalidatePath("/protected");

  return { success: "Conta a receber cadastrada com sucesso." };
}

export async function updateReceivableIncomeStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "previsto");

  if (!id || !["previsto", "recebido", "atrasado"].includes(status)) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("receivable_incomes")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/contas-a-receber");
  revalidatePath("/protected");
}

export async function deleteReceivableIncome(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("receivable_incomes")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/contas-a-receber");
  revalidatePath("/protected");
}
