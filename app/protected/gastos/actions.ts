"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ExpenseFormState } from "@/lib/finance/server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const familyMemberId = String(formData.get("family_member_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const expenseDate = String(formData.get("expense_date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const purchaseLocation = String(formData.get("purchase_location") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const bankOrCard = String(formData.get("bank_or_card") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!familyMemberId) {
    return { error: "Selecione a pessoa responsavel pelo gasto." };
  }

  if (!expenseDate) {
    return { error: "Informe a data do gasto." };
  }

  if (!description) {
    return { error: "Informe a descricao do gasto." };
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return { error: "Informe um valor valido para o gasto." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("expenses").insert({
    owner_id: ownerId,
    family_member_id: familyMemberId,
    category_id: categoryId || null,
    expense_date: expenseDate,
    description,
    purchase_location: purchaseLocation || null,
    amount,
    payment_method: paymentMethod || null,
    bank_or_card: bankOrCard || null,
    notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/gastos");
  revalidatePath("/protected");

  return { success: "Gasto cadastrado com sucesso." };
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase.from("expenses").delete().eq("id", id).eq("owner_id", ownerId);

  revalidatePath("/protected/gastos");
  revalidatePath("/protected");
}
