"use server";

import { getCurrentProfile } from "@/lib/finance/access-control";
import type { FamilyMemberFormState } from "@/lib/finance/server";
import { revalidateOrganizationPaths } from "@/lib/organizations/revalidation";
import { requireOrganizationAccess } from "@/lib/organizations/server";
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

  const { error } = await supabase.from("family_members").insert({
    owner_id: profile.owner_id,
    organization_id: organization.id,
    name,
    role: role || null,
    monthly_limit: monthlyLimit,
    currency: "EUR",
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

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

  const { error } = await supabase
    .from("family_members")
    .update({
      name,
      role: role || null,
      monthly_limit: monthlyLimit,
      organization_id: organization.id,
    })
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
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
  const isActive = String(formData.get("is_active") ?? "true") === "true";

  if (!id) {
    return { error: "Pessoa nao encontrada." };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  const { error } = await supabase
    .from("family_members")
    .update({
      is_active: !isActive,
      organization_id: organization.id,
    })
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id);

  if (error) {
    return { error: error.message };
  }

  revalidateOrganizationPaths(["/protected/pessoas", "/protected"], organization.slug);

  return { success: isActive ? "Pessoa desativada com sucesso." : "Pessoa ativada com sucesso." };
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
