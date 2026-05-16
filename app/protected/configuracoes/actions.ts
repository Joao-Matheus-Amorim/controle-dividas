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

function parseExpenseCategoryForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  return {
    name,
    description,
  };
}

function validateExpenseCategoryInput(input: ReturnType<typeof parseExpenseCategoryForm>): FormState | null {
  if (!input.name) {
    return { error: "Informe o nome da categoria." };
  }

  return null;
}

export async function createExpenseCategory(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = parseExpenseCategoryForm(formData);
  const validationError = validateExpenseCategoryInput(input);

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { error } = await supabase.from("expense_categories").insert({
    owner_id: ownerId,
    name: input.name,
    description: input.description || null,
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

export async function updateExpenseCategory(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const input = parseExpenseCategoryForm(formData);
  const validationError = validateExpenseCategoryInput(input);

  if (!id) {
    return { error: "Categoria nao encontrada." };
  }

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();

  const { data: category, error: fetchError } = await supabase
    .from("expense_categories")
    .select("id, is_default")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!category) {
    return { error: "Categoria nao encontrada." };
  }

  if (category.is_default) {
    return { error: "Categorias padrao nao podem ser editadas nesta fase." };
  }

  const { error } = await supabase
    .from("expense_categories")
    .update({
      name: input.name,
      description: input.description || null,
    })
    .eq("id", id)
    .eq("owner_id", ownerId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected");

  return { success: "Categoria atualizada com sucesso." };
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
    .eq("owner_id", ownerId)
    .eq("is_default", false);

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
