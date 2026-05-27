"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

type FormState = {
  error?: string;
  success?: string;
};

export type SettingsActionState = {
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
  const { organization } = await requireOrganizationAccess();

  const { error } = await supabase.from("expense_categories").insert({
    owner_id: ownerId,
    organization_id: organization.id,
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
  const { organization } = await requireOrganizationAccess();

  const { data: category, error: fetchError } = await supabase
    .from("expense_categories")
    .select("id, is_default")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .eq("organization_id", organization.id)
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
      organization_id: organization.id,
    })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected");

  return { success: "Categoria atualizada com sucesso." };
}

export async function deleteExpenseCategory(
  formData: FormData,
): Promise<SettingsActionState> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Categoria nao encontrada." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();
  const { organization } = await requireOrganizationAccess();

  const { error } = await supabase
    .from("expense_categories")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)
    .eq("is_default", false)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected");

  return { success: "Categoria excluida com sucesso." };
}

export async function deleteExpenseCategoryWithState(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  return deleteExpenseCategory(formData);
}

export async function deleteExpenseCategoryFormAction(formData: FormData): Promise<void> {
  await deleteExpenseCategory(formData);
}

export async function updateFamilyMemberLimit(
  formData: FormData,
): Promise<SettingsActionState> {
  const id = String(formData.get("id") ?? "");
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!id) {
    return { error: "Pessoa nao encontrada." };
  }

  if (Number.isNaN(monthlyLimit) || monthlyLimit < 0) {
    return { error: "Informe um limite mensal valido." };
  }

  const supabase = await createClient();
  const ownerId = await getCurrentUserId();
  const { organization } = await requireOrganizationAccess();

  const { error } = await supabase
    .from("family_members")
    .update({
      monthly_limit: monthlyLimit,
      organization_id: organization.id,
    })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/configuracoes");
  revalidatePath("/protected/pessoas");
  revalidatePath("/protected/gastos");
  revalidatePath("/protected/relatorios");
  revalidatePath("/protected");

  return { success: "Limite atualizado com sucesso." };
}

export async function updateFamilyMemberLimitWithState(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  return updateFamilyMemberLimit(formData);
}

export async function updateFamilyMemberLimitFormAction(formData: FormData): Promise<void> {
  await updateFamilyMemberLimit(formData);
}
