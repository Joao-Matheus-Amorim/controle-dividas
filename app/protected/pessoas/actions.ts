"use server";

import { getCurrentProfile } from "@/lib/finance/access-control";
import {
  familyMemberLimitRateLimit,
  recordFamilyMemberLimitAuditEvent,
} from "@/lib/finance/member-limit-controls";
import {
  familyMemberStatusRateLimit,
  recordFamilyMemberStatusAuditEvent,
} from "@/lib/finance/member-status-controls";
import {
  familyMemberCreateRateLimit,
  familyMemberUpdateRateLimit,
  recordFamilyMemberWriteAuditEvent,
} from "@/lib/finance/member-write-controls";
import type { FamilyMemberFormState } from "@/lib/finance/server";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { checkSensitiveOperationRateLimit } from "@/lib/security/sensitive-rate-limit";
import { createClient } from "@/lib/supabase/server";

export type FamilyMemberActionState = {
  error?: string;
  success?: string;
};

export async function createFamilyMember(
  _prevState: FamilyMemberFormState,
  formData: FormData,
): Promise<FamilyMemberFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!name) {
    return { error: "Informe o nome da pessoa." };
  }

  if (Number.isNaN(monthlyLimit) || monthlyLimit < 0) {
    return { error: "Informe um limite mensal valido." };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();
  const rateLimit = checkSensitiveOperationRateLimit({
    ...familyMemberCreateRateLimit,
    actorKey: profile.owner_id,
    organizationId: organization.id,
  });

  if (!rateLimit.allowed) {
    await recordFamilyMemberWriteAuditEvent({
      organizationId: organization.id,
      action: "finance.member.create",
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        member_created: true,
      },
    });

    return { error: "Muitas tentativas de cadastro de pessoa. Tente novamente em alguns minutos." };
  }

  const { data: member, error } = await supabase.from("family_members").insert({
    owner_id: profile.owner_id,
    organization_id: organization.id,
    name,
    role: role || null,
    monthly_limit: monthlyLimit,
    currency: "EUR",
    is_active: true,
  }).select("id").single();

  if (error) {
    return { error: error.message };
  }

  await recordFamilyMemberWriteAuditEvent({
    organizationId: organization.id,
    action: "finance.member.create",
    familyMemberId: member?.id ? String(member.id) : null,
    metadata: {
      member_created: true,
    },
  });

  revalidateOrganizationPaths(["/protected/pessoas", "/protected"], organization.slug);

  return { success: "Pessoa cadastrada com sucesso." };
}

export async function updateFamilyMember(
  formData: FormData,
): Promise<FamilyMemberActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!id) {
    return { error: "Pessoa nao encontrada." };
  }

  if (!name) {
    return { error: "Informe o nome da pessoa." };
  }

  if (Number.isNaN(monthlyLimit) || monthlyLimit < 0) {
    return { error: "Informe um limite mensal valido." };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: member, error: fetchError } = await supabase
    .from("family_members")
    .select("id, name, role, monthly_limit")
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!member) {
    return { error: "Pessoa nao encontrada." };
  }

  const currentRole = String(member.role ?? "").trim();
  const profileChanged =
    String(member.name ?? "").trim() !== name || currentRole !== role;
  const limitChanged = Number(member.monthly_limit ?? 0) !== monthlyLimit;

  if (profileChanged) {
    const rateLimit = checkSensitiveOperationRateLimit({
      ...familyMemberUpdateRateLimit,
      actorKey: profile.owner_id,
      organizationId: organization.id,
      targetKey: id,
    });

    if (!rateLimit.allowed) {
      await recordFamilyMemberWriteAuditEvent({
        organizationId: organization.id,
        action: "finance.member.update",
        familyMemberId: id,
        outcome: "denied",
        metadata: {
          status: "rate_limited",
          member_profile_changed: true,
        },
      });

      return { error: "Muitas tentativas de alteracao de pessoa. Tente novamente em alguns minutos." };
    }
  }

  if (limitChanged) {
    const rateLimit = checkSensitiveOperationRateLimit({
      ...familyMemberLimitRateLimit,
      actorKey: profile.owner_id,
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
  }

  const { error, count } = await supabase
    .from("family_members")
    .update({
      name,
      role: role || null,
      monthly_limit: monthlyLimit,
      organization_id: organization.id,
    }, { count: "exact" })
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  if (count !== 1) {
    return { error: "Pessoa nao encontrada." };
  }

  if (limitChanged) {
    await recordFamilyMemberLimitAuditEvent({
      organizationId: organization.id,
      familyMemberId: id,
      metadata: {
        limit_changed: true,
      },
    });
  }

  if (profileChanged) {
    await recordFamilyMemberWriteAuditEvent({
      organizationId: organization.id,
      action: "finance.member.update",
      familyMemberId: id,
      metadata: {
        member_profile_changed: true,
      },
    });
  }

  revalidateOrganizationPaths(
    ["/protected/pessoas", "/protected/admin/usuarios", "/protected"],
    organization.slug,
  );

  return { success: "Pessoa atualizada com sucesso." };
}

export async function updateFamilyMemberWithState(
  _prevState: FamilyMemberActionState,
  formData: FormData,
): Promise<FamilyMemberActionState> {
  return updateFamilyMember(formData);
}

export async function updateFamilyMemberFormAction(formData: FormData): Promise<void> {
  await updateFamilyMember(formData);
}

export async function toggleFamilyMemberStatus(
  formData: FormData,
): Promise<FamilyMemberActionState> {
  const id = String(formData.get("id") ?? "");
  const submittedActiveValue = String(formData.get("is_active") ?? "");

  if (!id) {
    return { error: "Pessoa nao encontrada." };
  }

  if (!["true", "false"].includes(submittedActiveValue)) {
    return { error: "Status invalido para esta pessoa." };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { data: member, error: fetchError } = await supabase
    .from("family_members")
    .select("id, is_active")
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!member) {
    return { error: "Pessoa nao encontrada." };
  }

  const currentActive = Boolean(member.is_active);
  const submittedActive = submittedActiveValue === "true";

  if (currentActive !== submittedActive) {
    return { error: "O status desta pessoa mudou. Atualize a lista antes de tentar novamente." };
  }

  const nextActive = !currentActive;
  const rateLimit = checkSensitiveOperationRateLimit({
    ...familyMemberStatusRateLimit,
    actorKey: profile.owner_id,
    organizationId: organization.id,
    targetKey: id,
  });

  if (!rateLimit.allowed) {
    await recordFamilyMemberStatusAuditEvent({
      organizationId: organization.id,
      familyMemberId: id,
      outcome: "denied",
      metadata: {
        status: "rate_limited",
        status_changed: true,
      },
    });

    return { error: "Muitas tentativas de alteracao de status. Tente novamente em alguns minutos." };
  }

  const { error, count } = await supabase
    .from("family_members")
    .update({
      is_active: nextActive,
      organization_id: organization.id,
    }, { count: "exact" })
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  if (count !== 1) {
    return { error: "Pessoa nao encontrada." };
  }

  await recordFamilyMemberStatusAuditEvent({
    organizationId: organization.id,
    familyMemberId: id,
    metadata: {
      status_changed: true,
    },
  });

  revalidateOrganizationPaths(["/protected/pessoas", "/protected"], organization.slug);

  return { success: currentActive ? "Pessoa desativada com sucesso." : "Pessoa ativada com sucesso." };
}

export async function toggleFamilyMemberStatusWithState(
  _prevState: FamilyMemberActionState,
  formData: FormData,
): Promise<FamilyMemberActionState> {
  return toggleFamilyMemberStatus(formData);
}

export async function toggleFamilyMemberStatusFormAction(formData: FormData): Promise<void> {
  await toggleFamilyMemberStatus(formData);
}
