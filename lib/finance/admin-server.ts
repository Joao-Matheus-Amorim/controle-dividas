import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FINANCE_MODULES, type FinanceModuleKey } from "./permissions";
import { getFamilyMembers, type DbFamilyMember } from "./server";

export type DbProfile = {
  id: string;
  owner_id: string;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
  name: string;
  email: string | null;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  family_members?: Pick<DbFamilyMember, "id" | "name"> | null;
};

export type DbModulePermission = {
  id: string;
  owner_id: string;
  profile_id: string;
  module: FinanceModuleKey;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  granted_by: string | null;
  created_at: string;
};

type MaybeArray<T> = T | T[] | null;

type RawProfile = Omit<DbProfile, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
};

export type ProfileFormState = {
  error?: string;
  success?: string;
};

export type PermissionFormState = {
  error?: string;
  success?: string;
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

function firstRelation<T>(relation: MaybeArray<T>): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function normalizeProfile(profile: RawProfile): DbProfile {
  return {
    ...profile,
    family_members: firstRelation(profile.family_members),
  };
}

export async function ensureAdminProfile() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active, created_at, family_members(id, name)")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingProfile) {
    return normalizeProfile(existingProfile as RawProfile);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      owner_id: user.id,
      auth_user_id: user.id,
      name: user.email?.split("@")[0] || "Admin",
      email: user.email,
      role: "admin",
      is_active: true,
    })
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active, created_at, family_members(id, name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeProfile(data as RawProfile);
}

export async function getAdminDashboardData() {
  const adminProfile = await ensureAdminProfile();
  const [profiles, members, permissions] = await Promise.all([
    getFamilyProfiles(),
    getFamilyMembers(),
    getFamilyPermissions(),
  ]);

  return {
    adminProfile,
    profiles,
    members,
    permissions,
    modules: FINANCE_MODULES,
  };
}

export async function getFamilyProfiles() {
  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active, created_at, family_members(id, name)")
    .eq("owner_id", adminProfile.owner_id)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawProfile[]).map(normalizeProfile);
}

export async function getFamilyPermissions() {
  const supabase = await createClient();
  const adminProfile = await ensureAdminProfile();

  const { data, error } = await supabase
    .from("user_module_permissions")
    .select("id, owner_id, profile_id, module, can_view, can_create, can_edit, can_delete, granted_by, created_at")
    .eq("owner_id", adminProfile.owner_id);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbModulePermission[];
}

export async function getPermissionsByProfile(profileId: string) {
  const permissions = await getFamilyPermissions();
  return permissions.filter((permission) => permission.profile_id === profileId);
}
