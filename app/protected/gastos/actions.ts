"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { ExpenseFormState } from "@/lib/finance/server";
import type { PermissionAction } from "@/lib/finance/permissions";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

function organizationOrLegacyFilter(organizationId: string) {
  return `organization_id.eq.${organizationId},organization_id.is.null`;
}

async function assertMemberBelongsToOrganization(
  ownerId: string,
  organizationId: string,
  familyMemberId: string,
) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", familyMemberId)
    .eq("owner_id", ownerId)
    .or(organizationOrLegacyFilter(organizationId))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    throw new Error("Pessoa responsavel nao pertence a esta organizacao.");
  }

  return member;
}

async function assertCategoryBelongsToOrganization(
  ownerId: string,
  organizationId: string,
  categoryId: string,
) {
  if (!categoryId) {
    return null;
  }

  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("expense_categories")
    .select("id, organization_id")
    .eq("id", categoryId)
    .eq("owner_id", ownerId)
    .or(organizationOrLegacyFilter(organizationId))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!category) {
    throw new Error("Categoria nao pertence a esta organizacao.");
  }

  return category;
}

async function assertCanManageExpense(
  expenseId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: expense, error } = await supabase
    .from("expenses")
    .select("id, owner_id, family_member_id")
    .eq("id", expenseId)
    .eq("owner_id", profile.owner_id)
    .or(organizationOrLegacyFilter(organization.id))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!expense?.family_member_id) {
    throw new Error("Gasto nao encontrado.");
  }

  await assertMemberBelongsToOrganization(
    profile.owner_id,
    organization.id,
    String(expense.family_member_id),
  );

  await assertCanAccessMember("GASTOS", action, String(expense.family_member_id));

  return {
    profile,
    organization,
    expense,
  };
}

function parseExpenseForm(formData: FormData) {
  const familyMemberId = String(formData.get("family_member_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const expenseDate = String(formData.get("expense_date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const purchaseLocation = String(formData.get("purchase_location") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  const bankOrCard = String(formData.get("bank_or_card") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    familyMemberId,
    categoryId,
    expenseDate,
    description,
    purchaseLocation,
    amount,
    paymentMethod,
    bankOrCard,
    notes,
  };
}

function validateExpenseInput(input: ReturnType<typeof parseExpenseForm>): ExpenseFormState | null {
  if (!input.familyMemberId) {
    return { error: "Selecione a pessoa responsavel pelo gasto." };
  }

  if (!input.expenseDate) {
    return { error: "Informe a data do gasto." };
  }

  if (!input.description) {
    return { error: "Informe a descricao do gasto." };
  }

  if (Number.isNaN(input.amount) || input.amount <= 0) {
    return { error: "Informe um valor valido para o gasto." };
  }

  return null;
}

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const input = parseExpenseForm(formData);
  const validationError = validateExpenseInput(input);

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  try {
    await assertMemberBelongsToOrganization(
      profile.owner_id,
      organization.id,
      input.familyMemberId,
    );
    await assertCategoryBelongsToOrganization(
      profile.owner_id,
      organization.id,
      input.categoryId,
    );
    await assertCanAccessMember("GASTOS", "can_create", input.familyMemberId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Voce nao tem permissao para cadastrar gasto para esta pessoa.",
    };
  }

  const { error } = await supabase.from("expenses").insert({
    owner_id: profile.owner_id,
    organization_id: organization.id,
    family_member_id: input.familyMemberId,
    category_id: input.categoryId || null,
    expense_date: input.expenseDate,
    description: input.description,
    purchase_location: input.purchaseLocation || null,
    amount: input.amount,
    payment_method: input.paymentMethod || null,
    bank_or_card: input.bankOrCard || null,
    notes: input.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/gastos");
  revalidatePath("/protected");

  return { success: "Gasto cadastrado com sucesso." };
}

export async function updateExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const id = String(formData.get("id") ?? "");
  const input = parseExpenseForm(formData);
  const validationError = validateExpenseInput(input);

  if (!id) {
    return { error: "Gasto nao encontrado." };
  }

  if (validationError) {
    return validationError;
  }

  try {
    const { profile, organization, expense } = await assertCanManageExpense(id, "can_edit");

    if (String(expense.family_member_id) !== input.familyMemberId) {
      await assertMemberBelongsToOrganization(
        profile.owner_id,
        organization.id,
        input.familyMemberId,
      );
      await assertCanAccessMember("GASTOS", "can_edit", input.familyMemberId);
    }

    await assertCategoryBelongsToOrganization(
      profile.owner_id,
      organization.id,
      input.categoryId,
    );

    const supabase = await createClient();
    const { error } = await supabase
      .from("expenses")
      .update({
        family_member_id: input.familyMemberId,
        category_id: input.categoryId || null,
        expense_date: input.expenseDate,
        description: input.description,
        purchase_location: input.purchaseLocation || null,
        amount: input.amount,
        payment_method: input.paymentMethod || null,
        bank_or_card: input.bankOrCard || null,
        notes: input.notes || null,
        organization_id: organization.id,
      })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .or(organizationOrLegacyFilter(organization.id));

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/protected/gastos");
    revalidatePath("/protected");

    return { success: "Gasto atualizado com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar este gasto.",
    };
  }
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");

  if (!id || confirmation !== "confirmado") {
    return;
  }

  try {
    const { profile, organization } = await assertCanManageExpense(id, "can_delete");
    const supabase = await createClient();

    await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .or(organizationOrLegacyFilter(organization.id));

    revalidatePath("/protected/gastos");
    revalidatePath("/protected");
  } catch {
    return;
  }
}