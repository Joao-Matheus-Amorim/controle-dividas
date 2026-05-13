"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type FormState = {
  error?: string;
  success?: string;
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

export async function createExpenseCategory(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Informe o nome da categoria." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("expense_categories").insert({
    owner_id: ownerId,
    name,
    description: description || null,
    is_default: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected");

  return { success: "Categoria cadastrada com sucesso." };
}

export async function deleteExpenseCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("expense_categories")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected");
}

export async function updateFamilyMemberLimit(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!id || Number.isNaN(monthlyLimit) || monthlyLimit < 0) {
    return;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  await supabase
    .from("family_members")
    .update({ monthly_limit: monthlyLimit })
    .eq("id", id)
    .eq("owner_id", ownerId);

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/pessoas");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected/relatorios");
  revalidatePath("/protected");
}
