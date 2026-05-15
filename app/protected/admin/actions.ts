"use server";

import { revalidatePath } from "next/cache";

import { ensureAdminProfile, type PermissionFormState, type ProfileFormState } from "@/lib/finance/admin-server";
import { FINANCE_MODULES, type FinanceModuleKey, type PermissionScope } from "@/lib/finance/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function normalizeScope(value: FormDataEntryValue | null): PermissionScope {
  if (value === "selected" || value === "family") {
    return value;
  }

  return "own";
}

function getAllowedMemberIds(formData: FormData, moduleKey: FinanceModuleKey) {
  return formData
    .getAll(`${moduleKey}.allowed_member_ids`)
    .map((value) => String(value))
    .filter(Boolean);
}

function normalizeAccessModel(value: string) {
  if (["basic", "family", "admin", "custom"].includes(value)) {
    return value;
  }

  return "basic";
}

function getDefaultPermissionForAccessModel(accessModel: string, module: FinanceModuleKey) {
  if (accessModel === "admin") {
    return {
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
      scope: "family" as PermissionScope,
    };
  }

  if (accessModel === "family") {
    const allowedModules: FinanceModuleKey[] = [
      "DASHBOARD",
      "GASTOS",
      "CONTAS_A_PAGAR",
      "CONTAS_A_RECEBER",
      "BANCOS",
    ];
    const canUseModule = allowedModules.includes(module);

    return {
      can_view: canUseModule,
      can_create: canUseModule && module !== "DASHBOARD",
      can_edit: canUseModule && module !== "DASHBOARD",
      can_delete: false,
      scope: "own" as PermissionScope,
    };
  }

  if (accessModel === "basic") {
    const canUseModule = module === "DASHBOARD" || module === "GASTOS";

    return {
      can_view: canUseModule,
      can_create: module === "GASTOS",
      can_edit: false,
      can_delete: false,
      scope: "own" as PermissionScope,
    };
  }

  return {
    can_view: module === "DASHBOARD",
    can_create: false,
    can_edit: false,
    can_delete: false,
    scope: "own" as PermissionScope,
  };
}

async function ensureUniqueEmail({
  ownerId,
  email,
  ignoreProfileId,
}: {
  ownerId: string;
  email: string;
  ignoreProfileId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id && data.id !== ignoreProfileId) {
    throw new Error("Este email ja esta cadastrado para outro acesso familiar.");
  }
}

async function ensureUniqueMemberAccess({
  ownerId,
  memberId,
  ignoreProfileId,
}: {
  ownerId: string;
  memberId: string;
  ignoreProfileId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("linked_family_member_id", memberId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.id && data.id !== ignoreProfileId) {
    throw new Error("Este membro da familia ja possui um acesso vinculado.");
  }
}

async function ensureMemberBelongsToOwner(ownerId: string, memberId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("id", memberId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Membro da familia invalido para este Admin.");
  }
}

async function findAuthUserIdByEmail(email: string) {
  const adminSupabase = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find(
      (item) => item.email?.trim().toLowerCase() === normalizedEmail,
    );

    if (user?.id) {
      return user.id;
    }

    if (data.users.length < 100) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function createFamilyUser(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const linkedFamilyMemberId = String(formData.get("linked_family_member_id") ?? "");
  const accessModel = normalizeAccessModel(String(formData.get("access_model") ?? "basic"));
  const role = accessModel === "admin" ? "admin" : "user";

  if (!name) return { error: "Informe o nome do acesso familiar." };
  if (!email) return { error: "Informe o email de acesso." };
  if (!linkedFamilyMemberId) return { error: "Selecione o membro da familia vinculado a este acesso." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  try {
    await ensureUniqueEmail({ ownerId: adminProfile.owner_id, email });
    await ensureUniqueMemberAccess({ ownerId: adminProfile.owner_id, memberId: linkedFamilyMemberId });
    await ensureMemberBelongsToOwner(adminProfile.owner_id, linkedFamilyMemberId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel validar o acesso." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      owner_id: adminProfile.owner_id,
      auth_user_id: null,
      linked_family_member_id: linkedFamilyMemberId,
      name,
      email,
      role,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (profile?.id) {
    const permissionRows = FINANCE_MODULES.map((module) => {
      const defaults = getDefaultPermissionForAccessModel(accessModel, module.key as FinanceModuleKey);

      return {
        owner_id: adminProfile.owner_id,
        profile_id: profile.id,
        module: module.key,
        can_view: defaults.can_view,
        can_create: defaults.can_create,
        can_edit: defaults.can_edit,
        can_delete: defaults.can_delete,
        scope: defaults.scope,
        allowed_member_ids: [],
        granted_by: adminProfile.id,
      };
    });

    const { error: permissionsError } = await supabase
      .from("user_module_permissions")
      .insert(permissionRows);

    if (permissionsError) return { error: permissionsError.message };
  }

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected/admin/permissoes");

  return { success: "Acesso familiar cadastrado com sucesso." };
}

export async function updateFamilyUser(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const linkedFamilyMemberId = String(formData.get("linked_family_member_id") ?? "");

  if (!id || !name || !email || !linkedFamilyMemberId) return;

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .eq("owner_id", adminProfile.owner_id)
    .maybeSingle();

  if (!profile || profile.role === "admin") return;

  try {
    await ensureUniqueEmail({ ownerId: adminProfile.owner_id, email, ignoreProfileId: id });
    await ensureUniqueMemberAccess({ ownerId: adminProfile.owner_id, memberId: linkedFamilyMemberId, ignoreProfileId: id });
    await ensureMemberBelongsToOwner(adminProfile.owner_id, linkedFamilyMemberId);
  } catch {
    return;
  }

  await supabase
    .from("profiles")
    .update({ name, email, linked_family_member_id: linkedFamilyMemberId })
    .eq("id", id)
    .eq("owner_id", adminProfile.owner_id);

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected/admin/permissoes");
}

export async function syncFamilyUserAuthLink(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, owner_id, email, role")
    .eq("id", id)
    .eq("owner_id", adminProfile.owner_id)
    .maybeSingle();

  if (!profile?.email || profile.role === "admin") return;

  const authUserId = await findAuthUserIdByEmail(profile.email);

  if (!authUserId) return;

  await supabase
    .from("profiles")
    .update({ auth_user_id: null })
    .eq("owner_id", adminProfile.owner_id)
    .eq("auth_user_id", authUserId);

  await supabase
    .from("profiles")
    .update({ auth_user_id: authUserId })
    .eq("id", profile.id)
    .eq("owner_id", adminProfile.owner_id);

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected/admin/permissoes");
  revalidatePath("/protected");
}

export async function deleteFamilyUser(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .eq("owner_id", adminProfile.owner_id)
    .maybeSingle();

  if (!profile || profile.role === "admin") return;

  await supabase.from("profiles").delete().eq("id", id).eq("owner_id", adminProfile.owner_id);

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/usuarios");
  revalidatePath("/protected/admin/permissoes");
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

  if (!profileId) return { error: "Selecione um perfil para configurar permissoes." };

  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const rows = FINANCE_MODULES.map((module) => {
    const key = module.key as FinanceModuleKey;
    const scope = normalizeScope(formData.get(`${key}.scope`));

    return {
      owner_id: adminProfile.owner_id,
      profile_id: profileId,
      module: key,
      can_view: formData.get(`${key}.can_view`) === "on",
      can_create: formData.get(`${key}.can_create`) === "on",
      can_edit: formData.get(`${key}.can_edit`) === "on",
      can_delete: formData.get(`${key}.can_delete`) === "on",
      scope,
      allowed_member_ids: scope === "selected" ? getAllowedMemberIds(formData, key) : [],
      granted_by: adminProfile.id,
    };
  });

  const { error } = await supabase
    .from("user_module_permissions")
    .upsert(rows, { onConflict: "profile_id,module" });

  if (error) return { error: error.message };

  revalidatePath("/protected/admin");
  revalidatePath("/protected/admin/permissoes");

  return { success: "Permissoes salvas com sucesso." };
}
