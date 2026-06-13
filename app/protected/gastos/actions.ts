"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { ExpenseFormState } from "@/lib/finance/types";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ExpenseActionState = {
  error?: string;
  success?: string;
};

const expenseCreateRateLimit = {
  operationKey: "finance.expense.create",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

const expenseUpdateRateLimit = {
  operationKey: "finance.expense.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

const expenseDeleteRateLimit = {
  operationKey: "finance.expense.delete",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

async function recordExpenseAuditEvent({
  organizationId,
  action,
  expenseId,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action:
    | "finance.expense.create"
    | "finance.expense.update"
    | "finance.expense.delete";
  expenseId: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "expense",
    targetId: expenseId,
    outcome,
    metadata,
  });
}

async function assertMemberBelongsToOrganization(
  organizationId: string,
  familyMemberId: string,
) {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, organization_id")
    .eq("id", familyMemberId)
    .eq("organization_id", organizationId)
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
    .eq("organization_id", organizationId)
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
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!expense?.family_member_id) {
    throw new Error("Gasto nao encontrado.");
  }

  await assertMemberBelongsToOrganization(
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

function validateExpenseInput(
  input: ReturnType<typeof parseExpenseForm>,
): ExpenseFormState | null {
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
      organization.id,
      input.familyMemberId,
    );
    await assertCategoryBelongsToOrganization(
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

  const rateLimit = checkSensitiveOperationRateLimit({
    ...expenseCreateRateLimit,
    actorKey: profile.id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordExpenseAuditEvent({
      organizationId: organization.id,
      action: "finance.expense.create",
      expenseId: null,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        expense_created: true,
        family_member_id: input.familyMemberId,
      },
    });

    return { error: "Muitas tentativas de cadastro de gasto. Tente novamente em alguns minutos." };
  }

  const { data: createdExpense, error } = await supabase
    .from("expenses").insert({
      owner_id: organization.owner_auth_user_id,
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
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await recordExpenseAuditEvent({
    organizationId: organization.id,
    action: "finance.expense.create",
    expenseId: createdExpense?.id ? String(createdExpense.id) : null,
    metadata: {
      expense_created: true,
      family_member_id: input.familyMemberId,
    },
  });

  revalidateOrganizationPaths(["/protected/gastos", "/protected"], organization.slug);

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
    const { profile, organization, expense } = await assertCanManageExpense(
      id,
      "can_edit",
    );

    if (String(expense.family_member_id) !== input.familyMemberId) {
      await assertMemberBelongsToOrganization(
        organization.id,
        input.familyMemberId,
      );
      await assertCanAccessMember("GASTOS", "can_edit", input.familyMemberId);
    }

    await assertCategoryBelongsToOrganization(
      organization.id,
      input.categoryId,
    );

    const rateLimit = checkSensitiveOperationRateLimit({
      ...expenseUpdateRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
      targetKey: id,
    });

    if (!rateLimit.allowed) {
      await recordExpenseAuditEvent({
        organizationId: organization.id,
        action: "finance.expense.update",
        expenseId: id,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          expense_changed: true,
          family_member_id: input.familyMemberId,
        },
      });

      return { error: "Muitas tentativas de alteracao de gasto. Tente novamente em alguns minutos." };
    }

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("expenses")
      .update(
        {
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
        },
        { count: "exact" },
      )
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Gasto nao encontrado." };
    }

    await recordExpenseAuditEvent({
      organizationId: organization.id,
      action: "finance.expense.update",
      expenseId: id,
      metadata: {
        expense_changed: true,
        family_member_id: input.familyMemberId,
      },
    });

    revalidateOrganizationPaths(["/protected/gastos", "/protected"], organization.slug);

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

export async function deleteExpense(
  formData: FormData,
): Promise<ExpenseActionState> {
  const id = String(formData.get("id") ?? "");
  const confirmation = String(formData.get("confirm_delete") ?? "");

  if (!id) {
    return { error: "Gasto nao encontrado." };
  }

  if (confirmation !== "confirmado") {
    return { error: "Confirme a exclusao antes de continuar." };
  }

  try {
    const { profile, organization, expense } = await assertCanManageExpense(
      id,
      "can_delete",
    );
    const rateLimit = checkSensitiveOperationRateLimit({
      ...expenseDeleteRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
    });

    if (!rateLimit.allowed) {
      await recordExpenseAuditEvent({
        organizationId: organization.id,
        action: "finance.expense.delete",
        expenseId: id,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          family_member_id: String(expense.family_member_id),
        },
      });

      return { error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos." };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("expenses")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Gasto nao encontrado." };
    }

    await recordExpenseAuditEvent({
      organizationId: organization.id,
      action: "finance.expense.delete",
      expenseId: id,
      metadata: {
        family_member_id: String(expense.family_member_id),
      },
    });

    revalidateOrganizationPaths(["/protected/gastos", "/protected"], organization.slug);

    return { success: "Gasto excluido com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir este gasto.",
    };
  }
}
