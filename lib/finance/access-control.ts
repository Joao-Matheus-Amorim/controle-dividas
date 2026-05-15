import { redirect } from "next/navigation";

import { linkAuthUserToFamilyProfile } from "@/lib/finance/profile-linking";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FeaturePermissionKey, FinanceModuleKey, PermissionAction } from "./permissions";

export type CurrentProfile = {
  id: string;
  owner_id: string;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
  name: string;
  email: string | null;
  role: "admin" | "adult" | "child" | "custom" | "user";
  is_active: boolean;
};

type ModulePermission = {
  profile_id: string;
  module: FinanceModuleKey;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  scope: "own" | "selected" | "family";
  allowed_member_ids: string[] | null;
};

type FeaturePermission = {
  profile_id: string;
  feature_key: FeaturePermissionKey;
  is_enabled: boolean;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth/login");
  }

  return {
    id: String(data.claims.sub),
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
}

function getConfiguredAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? null;
}

function isConfiguredAdminEmail(email: string | null) {
  const adminEmail = getConfiguredAdminEmail();
  return Boolean(adminEmail && email && email.toLowerCase() === adminEmail);
}

async function getProfileByAuthUserId(authUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CurrentProfile | null;
}

async function getProfileByAuthorizedEmail(email: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CurrentProfile | null;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const existingProfile = await getProfileByAuthUserId(user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const authorizedProfile = await getProfileByAuthorizedEmail(user.email);

  if (authorizedProfile) {
    if (!authorizedProfile.is_active) {
      redirect("/auth/error?error=Este acesso esta bloqueado pelo Admin familiar.");
    }

    if (authorizedProfile.auth_user_id && authorizedProfile.auth_user_id !== user.id) {
      redirect("/auth/error?error=Este email ja esta vinculado a outro acesso.");
    }

    const linkResult = await linkAuthUserToFamilyProfile({
      authUserId: user.id,
      email: user.email,
    });

    if (!linkResult.linked) {
      redirect(`/auth/error?error=${encodeURIComponent(linkResult.reason)}`);
    }

    const linkedProfile = await getProfileByAuthUserId(user.id);

    if (linkedProfile) {
      return linkedProfile;
    }
  }

  if (!isConfiguredAdminEmail(user.email)) {
    redirect("/auth/error?error=Seu email ainda nao foi autorizado pelo Admin familiar.");
  }

  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      owner_id: user.id,
      auth_user_id: user.id,
      name: "Danyel",
      email: user.email,
      role: "admin",
      is_active: true,
    },
    { onConflict: "auth_user_id", ignoreDuplicates: true },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const profile = await getProfileByAuthUserId(user.id);

  if (!profile) {
    throw new Error("Nao foi possivel carregar o perfil atual.");
  }

  return profile;
}

async function getAllActiveMemberIds(ownerId: string) {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("family_members")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((member) => String(member.id));
}

export async function getModulePermission(profileId: string, module: FinanceModuleKey) {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("user_module_permissions")
    .select("profile_id, module, can_view, can_create, can_edit, can_delete, scope, allowed_member_ids")
    .eq("profile_id", profileId)
    .eq("module", module)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ModulePermission | null;
}

export async function getFeaturePermission(profileId: string, featureKey: FeaturePermissionKey) {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("user_feature_permissions")
    .select("profile_id, feature_key, is_enabled")
    .eq("profile_id", profileId)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as FeaturePermission | null;
}

export async function canUseFeature(featureKey: FeaturePermissionKey) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  const permission = await getFeaturePermission(profile.id, featureKey);
  return Boolean(permission?.is_enabled);
}

export async function canViewModule(module: FinanceModuleKey) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  const permission = await getModulePermission(profile.id, module);
  return Boolean(permission?.can_view);
}

export async function getVisibleModuleKeys(modules: FinanceModuleKey[]) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return [];
  }

  if (profile.role === "admin") {
    return modules;
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("user_module_permissions")
    .select("module, can_view")
    .eq("profile_id", profile.id)
    .eq("can_view", true);

  if (error) {
    throw new Error(error.message);
  }

  const visible = new Set((data ?? []).map((permission) => String(permission.module)));
  return modules.filter((module) => visible.has(module));
}

export async function getAccessibleMemberIds(module: FinanceModuleKey, action: PermissionAction = "can_view") {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return [];
  }

  if (profile.role === "admin") {
    return getAllActiveMemberIds(profile.owner_id);
  }

  const permission = await getModulePermission(profile.id, module);

  if (!permission || !permission[action]) {
    return [];
  }

  if (permission.scope === "family") {
    return getAllActiveMemberIds(profile.owner_id);
  }

  if (permission.scope === "selected") {
    return permission.allowed_member_ids ?? [];
  }

  return profile.linked_family_member_id ? [profile.linked_family_member_id] : [];
}

export async function assertCanAccessMember(
  module: FinanceModuleKey,
  action: PermissionAction,
  targetMemberId: string,
) {
  const accessibleMemberIds = await getAccessibleMemberIds(module, action);

  if (!accessibleMemberIds.includes(targetMemberId)) {
    throw new Error("Voce nao tem permissao para executar esta acao para esta pessoa.");
  }

  return true;
}
