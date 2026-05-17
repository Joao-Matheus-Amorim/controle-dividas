"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/finance/access-control";
import type { FamilyMemberFormState } from "@/lib/finance/server";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";

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

  revalidatePath("/protected/pessoas");
  revalidatePath("/protected");

  return { success: "Pessoa cadastrada com sucesso." };
}

export async function updateFamilyMember(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const monthlyLimit = Number(formData.get("monthly_limit") ?? 0);

  if (!id || !name || Number.isNaN(monthlyLimit) || monthlyLimit < 0) {
    return;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  await supabase
    .from("family_members")
    .update({
      name,
      role: role || null,
      monthly_limit: monthlyLimit,
    })
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id);

  revalidatePath("/protected/pessoas");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected");
}

export async function toggleFamilyMemberStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "true") === "true";

  if (!id) {
    return;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { organization } = await requireOrganizationAccess();

  await supabase
    .from("family_members")
    .update({ is_active: !isActive })
    .eq("id", id)
    .eq("owner_id", profile.owner_id)
    .eq("organization_id", organization.id);

  revalidatePath("/protected/pessoas");
  revalidatePath("/protected");
}
