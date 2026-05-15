"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { ExpenseFormState } from "@/lib/finance/server";
import type { PermissionAction } from "@/lib/finance/permissions";
import { createClient } from "@/lib/supabase/server";

async function assertCanManageExpense(
  expenseId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: expense, error } = await supabase
    .from("expenses")
    .select("id, owner_id, family_member_id")
    .eq("id", expenseId)
    .eq("owner_id", profile.owner_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!expense?.family_member_id) {
    throw new Error("Gasto nao encontrado.");
  }

  await assertCanAccessMember("GASTOS", action, String(expense.family_member_id));

  return {
    profile,
    expense,
  };
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
  const profile = await getCurrentProfile();

  try {
    await assertCanAccessMember("GASTOS", "can_create", familyMemberId);
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

  try {
    const { profile } = await assertCanManageExpense(id, "can_delete");
    const supabase = await createClient();

    await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("owner_id", profile.owner_id);

    revalidatePath("/protected/gastos");
    revalidatePath("/protected");
  } catch {
    return;
  }
}
