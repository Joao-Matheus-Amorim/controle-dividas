"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { BankAccountFormState } from "@/lib/finance/banks-server";
import { createClient } from "@/lib/supabase/server";

async function assertCanManageBankAccount(
  accountId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: account, error } = await supabase
    .from("banks")
    .select("id, owner_id, family_member_id")
    .eq("id", accountId)
    .eq("owner_id", profile.owner_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!account?.family_member_id) {
    throw new Error("Banco nao encontrado ou sem pessoa vinculada.");
  }

  await assertCanAccessMember("BANCOS", action, String(account.family_member_id));

  return {
    profile,
    account,
  };
}

function parseBankAccountForm(formData: FormData) {
  const familyMemberId = String(formData.get("family_member_id") ?? "");
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const accountType = String(formData.get("account_type") ?? "").trim();
  const currentBalance = Number(formData.get("current_balance") ?? 0);
  const currency = String(formData.get("currency") ?? "EUR").trim() || "EUR";
  const notes = String(formData.get("notes") ?? "").trim();

  return {
    familyMemberId,
    bankName,
    accountType,
    currentBalance,
    currency,
    notes,
  };
}

function validateBankAccountInput(input: ReturnType<typeof parseBankAccountForm>): BankAccountFormState | null {
  if (!input.familyMemberId) {
    return { error: "Selecione a pessoa vinculada ao banco." };
  }

  if (!input.bankName) {
    return { error: "Informe o nome do banco." };
  }

  if (Number.isNaN(input.currentBalance)) {
    return { error: "Informe um saldo valido." };
  }

  return null;
}

export async function createBankAccount(
  _prevState: BankAccountFormState,
  formData: FormData,
): Promise<BankAccountFormState> {
  const input = parseBankAccountForm(formData);
  const validationError = validateBankAccountInput(input);

  if (validationError) {
    return validationError;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();

  try {
    await assertCanAccessMember("BANCOS", "can_create", input.familyMemberId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Voce nao tem permissao para cadastrar banco para esta pessoa.",
    };
  }

  const { error } = await supabase.from("banks").insert({
    owner_id: profile.owner_id,
    family_member_id: input.familyMemberId,
    bank_name: input.bankName,
    account_type: input.accountType || null,
    current_balance: input.currentBalance,
    currency: input.currency,
    notes: input.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/bancos");
  revalidatePath("/protected");

  return { success: "Banco cadastrado com sucesso." };
}

export async function updateBankAccount(
  _prevState: BankAccountFormState,
  formData: FormData,
): Promise<BankAccountFormState> {
  const id = String(formData.get("id") ?? "");
  const input = parseBankAccountForm(formData);
  const validationError = validateBankAccountInput(input);

  if (!id) {
    return { error: "Banco nao encontrado." };
  }

  if (validationError) {
    return validationError;
  }

  try {
    const { profile, account } = await assertCanManageBankAccount(id, "can_edit");

    if (String(account.family_member_id) !== input.familyMemberId) {
      await assertCanAccessMember("BANCOS", "can_edit", input.familyMemberId);
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("banks")
      .update({
        family_member_id: input.familyMemberId,
        bank_name: input.bankName,
        account_type: input.accountType || null,
        current_balance: input.currentBalance,
        currency: input.currency,
        notes: input.notes || null,
      })
      .eq("id", id)
      .eq("owner_id", profile.owner_id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/protected/bancos");
    revalidatePath("/protected");

    return { success: "Banco atualizado com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar este banco.",
    };
  }
}

export async function updateBankAccountBalance(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const currentBalance = Number(formData.get("current_balance") ?? 0);

  if (!id || Number.isNaN(currentBalance)) {
    return;
  }

  try {
    const { profile } = await assertCanManageBankAccount(id, "can_edit");
    const supabase = await createClient();

    await supabase
      .from("banks")
      .update({ current_balance: currentBalance })
      .eq("id", id)
      .eq("owner_id", profile.owner_id);

    revalidatePath("/protected/bancos");
    revalidatePath("/protected");
  } catch {
    return;
  }
}

export async function deleteBankAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  try {
    const { profile } = await assertCanManageBankAccount(id, "can_delete");
    const supabase = await createClient();

    await supabase.from("banks").delete().eq("id", id).eq("owner_id", profile.owner_id);

    revalidatePath("/protected/bancos");
    revalidatePath("/protected");
  } catch {
    return;
  }
}
