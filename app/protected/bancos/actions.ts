"use server";

import { recordAuditEvent } from "@/lib/audit/events";
import {
  assertCanAccessMember,
  getCurrentProfile,
} from "@/lib/finance/access-control";
import type { PermissionAction } from "@/lib/finance/permissions";
import type { BankAccountFormState } from "@/lib/finance/banks-server";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

export type BankAccountActionState = {
  error?: string;
  success?: string;
};

const bankDeleteRateLimit = {
  operationKey: "finance.bank.delete",
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

const bankCreateRateLimit = {
  operationKey: "finance.bank.create",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

const bankUpdateRateLimit = {
  operationKey: "finance.bank.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

const bankBalanceRateLimit = {
  operationKey: "finance.bank.balance.update",
  limit: 10,
  windowMs: 10 * 60 * 1000,
};

async function recordBankAuditEvent({
  organizationId,
  action,
  bankId,
  outcome = "success",
  metadata,
}: {
  organizationId: string;
  action:
    | "finance.bank.create"
    | "finance.bank.update"
    | "finance.bank.balance.update"
    | "finance.bank.delete";
  bankId: string | null;
  outcome?: "success" | "denied";
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await recordAuditEvent({
    organizationId,
    action,
    targetType: "bank",
    targetId: bankId,
    outcome,
    metadata,
  });
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
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!member) {
    throw new Error("Pessoa vinculada nao pertence a esta organizacao.");
  }

  return member;
}

async function assertCanManageBankAccount(
  accountId: string,
  action: Extract<PermissionAction, "can_edit" | "can_delete">,
) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: account, error } = await supabase
    .from("banks")
    .select("id, owner_id, family_member_id, bank_name, account_type, current_balance, currency, notes")
    .eq("id", accountId)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!account?.family_member_id) {
    throw new Error("Banco nao encontrado ou sem pessoa vinculada.");
  }

  await assertMemberBelongsToOrganization(
    profile.owner_id,
    organization.id,
    String(account.family_member_id),
  );

  await assertCanAccessMember("BANCOS", action, String(account.family_member_id));

  return {
    profile,
    organization,
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

function hasBankAccountWriteChanges(
  account: Record<string, unknown>,
  input: ReturnType<typeof parseBankAccountForm>,
) {
  return (
    String(account.family_member_id ?? "") !== input.familyMemberId ||
    String(account.bank_name ?? "").trim() !== input.bankName ||
    String(account.account_type ?? "").trim() !== input.accountType ||
    String(account.currency ?? "EUR").trim() !== input.currency ||
    String(account.notes ?? "").trim() !== input.notes
  );
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
  const { organization } = await requireOrganizationAccess();

  try {
    await assertMemberBelongsToOrganization(
      profile.owner_id,
      organization.id,
      input.familyMemberId,
    );
    await assertCanAccessMember("BANCOS", "can_create", input.familyMemberId);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Voce nao tem permissao para cadastrar banco para esta pessoa.",
    };
  }

  const rateLimit = checkSensitiveOperationRateLimit({
    ...bankCreateRateLimit,
    actorKey: profile.id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordBankAuditEvent({
      organizationId: organization.id,
      action: "finance.bank.create",
      bankId: null,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        bank_created: true,
        family_member_id: input.familyMemberId,
      },
    });

    return { error: "Muitas tentativas de cadastro de banco. Tente novamente em alguns minutos." };
  }

  const { data: createdBank, error } = await supabase.from("banks").insert({
    owner_id: profile.owner_id,
    organization_id: organization.id,
    family_member_id: input.familyMemberId,
    bank_name: input.bankName,
    account_type: input.accountType || null,
    current_balance: input.currentBalance,
    currency: input.currency,
    notes: input.notes || null,
  }).select("id").single();

  if (error) {
    return { error: error.message };
  }

  await recordBankAuditEvent({
    organizationId: organization.id,
    action: "finance.bank.create",
    bankId: createdBank?.id ? String(createdBank.id) : null,
    metadata: {
      bank_created: true,
      family_member_id: input.familyMemberId,
    },
  });

  revalidateOrganizationPaths(["/protected/bancos", "/protected"], organization.slug);

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
    const { profile, organization, account } = await assertCanManageBankAccount(id, "can_edit");
    const balanceChanged = Number(account.current_balance) !== input.currentBalance;
    const bankChanged = hasBankAccountWriteChanges(account, input);

    if (String(account.family_member_id) !== input.familyMemberId) {
      await assertMemberBelongsToOrganization(
        profile.owner_id,
        organization.id,
        input.familyMemberId,
      );
      await assertCanAccessMember("BANCOS", "can_edit", input.familyMemberId);
    }

    if (bankChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...bankUpdateRateLimit,
        actorKey: profile.id,
        organizationId: organization.id,
        targetKey: id,
      });

      if (!rateLimit.allowed) {
        await recordBankAuditEvent({
          organizationId: organization.id,
          action: "finance.bank.update",
          bankId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            bank_changed: true,
            family_member_id: input.familyMemberId,
          },
        });

        return { error: "Muitas tentativas de alteracao de banco. Tente novamente em alguns minutos." };
      }
    }

    if (balanceChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...bankBalanceRateLimit,
        actorKey: profile.id,
        organizationId: organization.id,
        targetKey: id,
      });

      if (!rateLimit.allowed) {
        await recordBankAuditEvent({
          organizationId: organization.id,
          action: "finance.bank.balance.update",
          bankId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            balance_changed: true,
            family_member_id: input.familyMemberId,
          },
        });

        return { error: "Muitas tentativas de alteracao de saldo. Tente novamente em alguns minutos." };
      }
    }

    const supabase = await createClient();
    const { error, count } = await supabase
      .from("banks")
      .update({
        family_member_id: input.familyMemberId,
        bank_name: input.bankName,
        account_type: input.accountType || null,
        current_balance: input.currentBalance,
        currency: input.currency,
        notes: input.notes || null,
        organization_id: organization.id,
      }, { count: "exact" })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Banco nao encontrado." };
    }

    if (bankChanged) {
      await recordBankAuditEvent({
        organizationId: organization.id,
        action: "finance.bank.update",
        bankId: id,
        metadata: {
          bank_changed: true,
          family_member_id: input.familyMemberId,
        },
      });
    }

    if (balanceChanged) {
      await recordBankAuditEvent({
        organizationId: organization.id,
        action: "finance.bank.balance.update",
        bankId: id,
        metadata: {
          balance_changed: true,
          family_member_id: input.familyMemberId,
        },
      });
    }

    revalidateOrganizationPaths(["/protected/bancos", "/protected"], organization.slug);

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

export async function updateBankAccountBalance(
  formData: FormData,
): Promise<BankAccountActionState> {
  const id = String(formData.get("id") ?? "");
  const currentBalance = Number(formData.get("current_balance") ?? 0);

  if (!id) {
    return { error: "Banco nao encontrado." };
  }

  if (Number.isNaN(currentBalance)) {
    return { error: "Informe um saldo valido." };
  }

  try {
    const { profile, organization, account } = await assertCanManageBankAccount(id, "can_edit");
    const balanceChanged = Number(account.current_balance) !== currentBalance;

    if (balanceChanged) {
      const rateLimit = checkSensitiveOperationRateLimit({
        ...bankBalanceRateLimit,
        actorKey: profile.id,
        organizationId: organization.id,
        targetKey: id,
      });

      if (!rateLimit.allowed) {
        await recordBankAuditEvent({
          organizationId: organization.id,
          action: "finance.bank.balance.update",
          bankId: id,
          outcome: "denied",
          metadata: {
            status: "rate_limited",
            balance_changed: true,
            family_member_id: String(account.family_member_id),
          },
        });

        return { error: "Muitas tentativas de alteracao de saldo. Tente novamente em alguns minutos." };
      }
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("banks")
      .update({
        current_balance: currentBalance,
        organization_id: organization.id,
      }, { count: "exact" })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Banco nao encontrado." };
    }

    if (balanceChanged) {
      await recordBankAuditEvent({
        organizationId: organization.id,
        action: "finance.bank.balance.update",
        bankId: id,
        metadata: {
          balance_changed: true,
          family_member_id: String(account.family_member_id),
        },
      });
    }

    revalidateOrganizationPaths(["/protected/bancos", "/protected"], organization.slug);

    return { success: "Saldo atualizado com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o saldo deste banco.",
    };
  }
}

export async function updateBankAccountBalanceWithState(
  _prevState: BankAccountActionState,
  formData: FormData,
): Promise<BankAccountActionState> {
  return updateBankAccountBalance(formData);
}

export async function updateBankAccountBalanceFormAction(formData: FormData): Promise<void> {
  await updateBankAccountBalance(formData);
}

export async function deleteBankAccount(
  formData: FormData,
): Promise<BankAccountActionState> {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Banco nao encontrado." };
  }

  try {
    const { profile, organization, account } = await assertCanManageBankAccount(id, "can_delete");
    const rateLimit = checkSensitiveOperationRateLimit({
      ...bankDeleteRateLimit,
      actorKey: profile.id,
      organizationId: organization.id,
    });

    if (!rateLimit.allowed) {
      await recordBankAuditEvent({
        organizationId: organization.id,
        action: "finance.bank.delete",
        bankId: id,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          family_member_id: String(account.family_member_id),
        },
      });

      return { error: "Muitas tentativas de exclusao. Tente novamente em alguns minutos." };
    }

    const supabase = await createClient();

    const { error, count } = await supabase
      .from("banks")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("owner_id", profile.owner_id)
      .eq("organization_id", organization.id);

    if (error) {
      return { error: error.message };
    }

    if (count !== 1) {
      return { error: "Banco nao encontrado." };
    }

    await recordBankAuditEvent({
      organizationId: organization.id,
      action: "finance.bank.delete",
      bankId: id,
      metadata: {
        family_member_id: String(account.family_member_id),
      },
    });

    revalidateOrganizationPaths(["/protected/bancos", "/protected"], organization.slug);

    return { success: "Banco excluido com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir este banco.",
    };
  }
}

export async function deleteBankAccountWithState(
  _prevState: BankAccountActionState,
  formData: FormData,
): Promise<BankAccountActionState> {
  return deleteBankAccount(formData);
}

export async function deleteBankAccountFormAction(formData: FormData): Promise<void> {
  await deleteBankAccount(formData);
}
