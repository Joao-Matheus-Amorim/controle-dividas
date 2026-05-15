import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { FinanceModuleKey, PermissionAction } from "./permissions";

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

export async function getCurrentProfile() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: existingProfile, error } = await supabase
    .from("profiles")
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (existingProfile) {
    return existingProfile as CurrentProfile;
  }

  if (!isConfiguredAdminEmail(user.email)) {
    redirect("/protected");
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return profile as CurrentProfile;
}

async function getAllActiveMemberIds(ownerId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
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
  const supabase = await createClient();

  const { data, error } = await supabase
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
