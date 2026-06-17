"use server";

import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/events";
import { getCurrentProfile } from "@/lib/finance/access-control";
import {
  familyMemberLimitRateLimit,
  recordFamilyMemberLimitAuditEvent,
} from "@/lib/finance/member-limit-controls";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

type FormState = {
  error?: string;
  success?: string;
};

export type SettingsActionState = {
  error?: string;
  success?: string;
};

const categoryDeleteRateLimit = {
  operationKey: "finance.category.delete",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

const categoryCreateRateLimit = {
  operationKey: "finance.category.create",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

const categoryUpdateRateLimit = {
  operationKey: "finance.category.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return String(data.claims.sub);
}

async function recordExpenseCategoryAuditEvent({
  organizationId,
  action = "finance.category.delete",
  categoryId,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action?: "finance.category.create" | "finance.category.update" | "finance.category.delete";
  categoryId: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "expense_category",
    targetId: categoryId,
    outcome,
    metadata,
  });
}

function parseExpenseCategoryForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const parentCategoryId = String(formData.get("parent_category_id") ?? "").trim();

  return {
    name,
    description,
    parentCategoryId,
  };
}

function validateExpenseCategoryInput(input: ReturnType<typeof parseExpenseCategoryForm>): FormState | null {
  if (!input.name) {
    return { error: "Informe o nome da categoria." };
  }

  return null;
}

async function validateExpenseCategoryParent({
  supabase,
  organizationId,
  parentCategoryId,
  currentCategoryId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  parentCategoryId: string;
  currentCategoryId?: string;
}): Promise<FormState | null> {
  if (!parentCategoryId) {
    return null;
  }

  if (currentCategoryId && parentCategoryId === currentCategoryId) {
    return { error: "Categoria nao pode ser subcategoria dela mesma." };
  }

  const { data: parentCategory, error } = await supabase
    .from("expense_categories")
    .select("id, parent_category_id")
    .eq("id", parentCategoryId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!parentCategory) {
    return { error: "Categoria principal nao encontrada." };
  }

  if (parentCategory.parent_category_id) {
    return { error: "Selecione uma categoria principal, nao uma subcategoria." };
  }

  if (currentCategoryId) {
    const { data: childCategory, error: childError } = await supabase
      .from("expense_categories")
      .select("id")
      .eq("parent_category_id", currentCategoryId)
      .eq("organization_id", organizationId)
      .limit(1)
      .maybeSingle();

    if (childError) {
      return { error: childError.message };
    }

    if (childCategory) {
      return { error: "Categoria com subcategorias nao pode virar subcategoria." };
    }
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
  const currentUserId = await getCurrentUserId();
  const { organization } = await requireOrganizationAdmin();
  const rateLimit = checkSensitiveOperationRateLimit({
    ...categoryCreateRateLimit,
    actorKey: currentUserId,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordExpenseCategoryAuditEvent({
      organizationId: organization.id,
      action: "finance.category.create",
      categoryId: null,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        category_created: true,
      },
    });

    return { error: "Muitas tentativas de cadastro de categoria. Tente novamente em alguns minutos." };
  }

  const parentValidationError = await validateExpenseCategoryParent({
    supabase,
    organizationId: organization.id,
    parentCategoryId: input.parentCategoryId,
  });

  if (parentValidationError) {
    return parentValidationError;
  }

  const { data: category, error } = await supabase.from("expense_categories").insert({
    owner_id: organization.owner_auth_user_id,
    organization_id: organization.id,
    parent_category_id: input.parentCategoryId || null,
    name: input.name,
    description: input.description || null,
    is_default: false,
  }).select("id").single();

  if (error) {
    return { error: error.message };
  }

  await recordExpenseCategoryAuditEvent({
    organizationId: organization.id,
    action: "finance.category.create",
    categoryId: category?.id ? String(category.id) : null,
    metadata: {
      category_created: true,
    },
  });

  revalidateOrganizationPaths(
    ["/protected/configuracoes", "/protected/gastos", "/protected"],
    organization.slug,
  );

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
  const currentUserId = await getCurrentUserId();
  const { organization } = await requireOrganizationAdmin();

  const { data: category, error: fetchError } = await supabase
    .from("expense_categories")
    .select("id, name, description, parent_category_id, is_default")
    .eq("id", id)
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

  const categoryChanged =
    String(category.name ?? "").trim() !== input.name ||
    String(category.description ?? "").trim() !== input.description ||
    String(category.parent_category_id ?? "") !== input.parentCategoryId;

  if (!categoryChanged) {
    return { success: "Categoria atualizada com sucesso." };
  }

  const parentValidationError = await validateExpenseCategoryParent({
    supabase,
    organizationId: organization.id,
    parentCategoryId: input.parentCategoryId,
    currentCategoryId: id,
  });

  if (parentValidationError) {
    return parentValidationError;
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...categoryUpdateRateLimit,
    actorKey: currentUserId,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordExpenseCategoryAuditEvent({
      organizationId: organization.id,
      action: "finance.category.update",
      categoryId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        category_changed: true,
      },
    });

    return { error: "Muitas tentativas de alteracao de categoria. Tente novamente em alguns minutos." };
  }

  const { error, count } = await supabase
    .from("expense_categories")
    .update({
      name: input.name,
      description: input.description || null,
      parent_category_id: input.parentCategoryId || null,
      organization_id: organization.id,
    }, { count: "exact" })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  if (count !== 1) {
    return { error: "Categoria nao encontrada." };
  }

  await recordExpenseCategoryAuditEvent({
    organizationId: organization.id,
    action: "finance.category.update",
    categoryId: id,
    metadata: {
      category_changed: true,
    },
  });

  revalidateOrganizationPaths(
    ["/protected/configuracoes", "/protected/gastos", "/protected"],
    organization.slug,
  );

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
  const currentUserId = await getCurrentUserId();
  const { organization } = await requireOrganizationAdmin();
  const rateLimit = checkSensitiveOperationRateLimit({
    ...categoryDeleteRateLimit,
    actorKey: currentUserId,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordExpenseCategoryAuditEvent({
      organizationId: organization.id,
      categoryId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
      },
    });

    return { error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos." };
  }

  const { error, count } = await supabase
    .from("expense_categories")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("is_default", false)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  if (count !== 1) {
    return { error: "Categoria nao encontrada." };
  }

  await recordExpenseCategoryAuditEvent({
    organizationId: organization.id,
    categoryId: id,
  });

  revalidateOrganizationPaths(
    ["/protected/configuracoes", "/protected/gastos", "/protected"],
    organization.slug,
  );

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
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAdmin();

  const { data: member, error: fetchError } = await supabase
    .from("family_members")
    .select("id, monthly_limit")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!member) {
    return { error: "Pessoa nao encontrada." };
  }

  if (Number(member.monthly_limit ?? 0) === monthlyLimit) {
    return { success: "Limite atualizado com sucesso." };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...familyMemberLimitRateLimit,
    actorKey: profile.id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordFamilyMemberLimitAuditEvent({
      organizationId: organization.id,
      familyMemberId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        limit_changed: true,
      },
    });

    return { error: "Muitas tentativas de alteracao de limite. Tente novamente em alguns minutos." };
  }

  const { error, count } = await supabase
    .from("family_members")
    .update({
      monthly_limit: monthlyLimit,
      organization_id: organization.id,
    }, { count: "exact" })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  if (count !== 1) {
    return { error: "Pessoa nao encontrada." };
  }

  await recordFamilyMemberLimitAuditEvent({
    organizationId: organization.id,
    familyMemberId: id,
    metadata: {
      limit_changed: true,
    },
  });

  revalidateOrganizationPaths(
    [
      "/protected/configuracoes",
      "/protected/pessoas",
      "/protected/gastos",
      "/protected/relatorios",
      "/protected",
    ],
    organization.slug,
  );

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
