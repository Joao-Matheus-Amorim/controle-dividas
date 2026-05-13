"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { BankAccountFormState } from "@/lib/finance/banks-server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function createBankAccount(
  _prevState: BankAccountFormState,
  formData: FormData,
): Promise<BankAccountFormState> {
  const familyMemberId = String(formData.get("family_member_id") ?? "");
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountType = String(formData.get("account_type") ?? "").trim();
  const currentBalance = Number(formData.get("current_balance") ?? 0);
  const currency = String(formData.get("currency") ?? "EUR").trim() || "EUR";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!bankName) {
    return { error: "Informe o nome do banco." };
  }

  if (Number.isNaN(currentBalance)) {
    return { error: "Informe um saldo valido." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("banks").insert({
    owner_id: ownerId,
    family_member_id: familyMemberId || null,
    bank_name: bankName,
    account_type: accountType || null,
    current_balance: currentBalance,
    currency,
    notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/bancos");
  revalidatePath("/protected");

  return { success: "Banco cadastrado com sucesso." };
}

export async function updateBankAccountBalance(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const currentBalance = Number(formData.get("current_balance") ?? 0);

  if (!id || Number.isNaN(currentBalance)) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("banks")
    .update({ current_balance: currentBalance })
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/bancos");
  revalidatePath("/protected");
}

export async function deleteBankAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase.from("banks").delete().eq("id", id).eq("owner_id", ownerId);

  revalidatePath("/protected/bancos");
  revalidatePath("/protected");
}
