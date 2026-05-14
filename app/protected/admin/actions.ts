"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { FINANCE_MODULES, type FinanceModuleKey } from "@/lib/finance/permissions";
import { ensureAdminProfile, type PermissionFormState, type ProfileFormState } from "@/lib/finance/admin-server";

export async function createFamilyUser(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const linkedFamilyMemberId = String(formData.get("linked_family_member_id") ?? "");
  const role = String(formData.get("role") ?? "user") === "admin" ? "admin" : "user";

  if (!name) {
    return { error: "Informe o nome do usuario familiar." };
  }

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      owner_id: adminProfile.owner_id,
      auth_user_id: null,
      linked_family_member_id: linkedFamilyMemberId || null,
      name,
      email: email || null,
      role,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  if (profile?.id) {
    await supabase.from("user_module_permissions").insert(
      FINANCE_MODULES.map((module) => ({
        owner_id: adminProfile.owner_id,
        profile_id: profile.id,
        module: module.key,
        can_view: role === "admin",
        can_create: role === "admin",
        can_edit: role === "admin",
        can_delete: role === "admin",
        granted_by: adminProfile.id,
      })),
    );
  }

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected/admin/permissoes");

  return { success: "Usuario familiar cadastrado com sucesso." };
}

export async function toggleFamilyUserStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "true") === "true";

  if (!id) return;

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  await supabase
    .from("profiles")
    .update({ is_active: !isActive })
    .eq("id", id)
    .eq("owner_id", adminProfile.owner_id);

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected/admin/permissoes");
}

export async function saveProfilePermissions(
  _prevState: PermissionFormState,
  formData: FormData,
): Promise<PermissionFormState> {
  const profileId = String(formData.get("profile_id") ?? "");

  if (!profileId) {
    return { error: "Selecione um perfil para configurar permissoes." };
  }

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const rows = FINANCE_MODULES.map((module) => {
    const key = module.key as FinanceModuleKey;

    return {
      owner_id: adminProfile.owner_id,
      profile_id: profileId,
      module: key,
      can_view: formData.get(`${key}.can_view`) === "on",
      can_create: formData.get(`${key}.can_create`) === "on",
      can_edit: formData.get(`${key}.can_edit`) === "on",
      can_delete: formData.get(`${key}.can_delete`) === "on",
      granted_by: adminProfile.id,
    };
  });

  const { error } = await supabase
    .from("user_module_permissions")
    .upsert(rows, { onConflict: "profile_id,module" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/permissoes");

  return { success: "Permissoes salvas com sucesso." };
}
