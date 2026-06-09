import { redirect } from "next/navigation";

import type {
  DbFeaturePermission,
  DbModulePermission,
  DbProfile,
} from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";
import { getOrganizationPath } from "@/lib/organizations/paths";
import { requireOrganizationAdmin } from "@/lib/organizations/server";
import { createClient } from "@/lib/supabase/server";
import {
  FEATURE_PERMISSIONS,
  FINANCE_MODULES,
} from "./permissions";

export type {
  DbFeaturePermission,
  DbModulePermission,
  DbProfile,
  PermissionFormState,
  ProfileFormState,
  ProfileRole,
} from "@/lib/finance/admin-types";

type MaybeArray<T> = T | T[] | null;

type RawProfile = Omit<DbProfile, "family_members"> & {
  family_members: MaybeArray<Pick<DbFamilyMember, "id" | "name">>;
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

async function getProfileByAuthUserId(authUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, organization_id, auth_user_id, linked_family_member_id, name, email, role, is_active, created_at, family_members(id, name)")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeProfile(data as RawProfile) : null;
}

function getProtectedFallbackPath(orgSlug?: string) {
  return orgSlug ? getOrganizationPath(orgSlug) : "/protected";
}

export async function ensureAdminProfile(orgSlug?: string) {
  const user = await getCurrentUser();
  const existingProfile = await getProfileByAuthUserId(user.id);

  if (existingProfile) {
    if (existingProfile.role !== "admin" || !existingProfile.is_active) {
      redirect(getProtectedFallbackPath(orgSlug));
    }

    return existingProfile;
  }

  redirect("/onboarding/organizacao");
}

export async function requireAdminProfile(orgSlug?: string) {
  const profile = await ensureAdminProfile(orgSlug);

  if (profile.role !== "admin" || !profile.is_active) {
    redirect(getProtectedFallbackPath(orgSlug));
  }

  return profile;
}

export async function getAdminDashboardData(orgSlug?: string) {
  const { organization } = await requireOrganizationAdmin(orgSlug);
  const adminProfile = await requireAdminProfile(orgSlug);
  const [profiles, members, permissions, featurePermissions] = await Promise.all([
    getFamilyProfiles(adminProfile, organization.id),
    getAdminFamilyMembers(organization.id),
    getFamilyPermissions(adminProfile, organization.id),
    getFamilyFeaturePermissions(adminProfile, organization.id),
  ]);

  return {
    adminProfile,
    profiles,
    members,
    permissions,
    featurePermissions,
    modules: FINANCE_MODULES,
    features: FEATURE_PERMISSIONS,
  };
}

async function getAdminFamilyMembers(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

async function resolveAdminReadOrganizationId(adminProfileParam?: DbProfile, organizationIdParam?: string) {
  if (adminProfileParam && organizationIdParam) {
    return organizationIdParam;
  }

  const { organization } = await requireOrganizationAdmin();

  if (organizationIdParam && organizationIdParam !== organization.id) {
    throw new Error("Voce nao tem permissao administrativa nesta organizacao.");
  }

  return organization.id;
}

export async function getFamilyProfiles(adminProfileParam?: DbProfile, organizationIdParam?: string) {
  const supabase = await createClient();
  const organizationId = await resolveAdminReadOrganizationId(adminProfileParam, organizationIdParam);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, organization_id, auth_user_id, linked_family_member_id, name, email, role, is_active, created_at, family_members(id, name)")
    .eq("organization_id", organizationId)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawProfile[]).map(normalizeProfile);
}

export async function getFamilyPermissions(adminProfileParam?: DbProfile, organizationIdParam?: string) {
  const supabase = await createClient();
  const organizationId = await resolveAdminReadOrganizationId(adminProfileParam, organizationIdParam);

  const { data, error } = await supabase
    .from("user_module_permissions")
    .select("id, owner_id, organization_id, profile_id, module, can_view, can_create, can_edit, can_delete, scope, allowed_member_ids, granted_by, created_at")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((permission) => ({
    ...permission,
    scope: permission.scope ?? "own",
    allowed_member_ids: permission.allowed_member_ids ?? [],
  })) as DbModulePermission[];
}

export async function getFamilyFeaturePermissions(adminProfileParam?: DbProfile, organizationIdParam?: string) {
  const supabase = await createClient();
  const organizationId = await resolveAdminReadOrganizationId(adminProfileParam, organizationIdParam);

  const { data, error } = await supabase
    .from("user_feature_permissions")
    .select("id, owner_id, organization_id, profile_id, feature_key, is_enabled, granted_by, created_at")
    .eq("organization_id", organizationId);

  if (error) {
    // The table is created by migration 004. Returning an empty list keeps older local databases usable until migration is applied.
    if (error.message.toLowerCase().includes("user_feature_permissions")) {
      return [] as DbFeaturePermission[];
    }

    throw new Error(error.message);
  }

  return (data ?? []) as DbFeaturePermission[];
}

export async function getPermissionsByProfile(profileId: string) {
  const permissions = await getFamilyPermissions();
  return permissions.filter((permission) => permission.profile_id === profileId);
}

export async function getFeaturePermissionsByProfile(profileId: string) {
  const permissions = await getFamilyFeaturePermissions();
  return permissions.filter((permission) => permission.profile_id === profileId);
}
