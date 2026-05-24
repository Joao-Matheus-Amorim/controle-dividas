import { redirect } from "next/navigation";

import type {
  DbFeaturePermission,
  DbModulePermission,
  DbProfile,
} from "@/lib/finance/admin-types";
import type { DbFamilyMember } from "@/lib/finance/types";
import { requireOrganizationAccess } from "@/lib/organizations/server";
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

function getConfiguredAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? null;
}

function isConfiguredAdminEmail(email: string | null) {
  const adminEmail = getConfiguredAdminEmail();
  return Boolean(adminEmail && email && email.toLowerCase() === adminEmail);
}

function organizationOrLegacyFilter(organizationId: string) {
  return `organization_id.eq.${organizationId},organization_id.is.null`;
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

export async function ensureAdminProfile() {
  const user = await getCurrentUser();
  const existingProfile = await getProfileByAuthUserId(user.id);

  if (existingProfile) {
    if (existingProfile.role !== "admin" || !existingProfile.is_active) {
      redirect("/protected");
    }

    return existingProfile;
  }

  if (!isConfiguredAdminEmail(user.email)) {
    redirect("/protected");
  }

  redirect("/onboarding/organizacao");
}

export async function requireAdminProfile() {
  const profile = await ensureAdminProfile();

  if (profile.role !== "admin" || !profile.is_active) {
    redirect("/protected");
  }

  return profile;
}

export async function getAdminDashboardData() {
  const adminProfile = await requireAdminProfile();
  const { organization } = await requireOrganizationAccess();
  const [profiles, members, permissions, featurePermissions] = await Promise.all([
    getFamilyProfiles(adminProfile, organization.id),
    getAdminFamilyMembers(adminProfile, organization.id),
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

async function getAdminFamilyMembers(adminProfile: DbProfile, organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, owner_id, name, role, monthly_limit, currency, is_active, created_at")
    .eq("owner_id", adminProfile.owner_id)
    .or(organizationOrLegacyFilter(organizationId))
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbFamilyMember[];
}

export async function getFamilyProfiles(adminProfileParam?: DbProfile, organizationIdParam?: string) {
  const supabase = await createClient();
  const adminProfile = adminProfileParam ?? (await requireAdminProfile());
  const organizationId = organizationIdParam ?? (await requireOrganizationAccess()).organization.id;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, organization_id, auth_user_id, linked_family_member_id, name, email, role, is_active, created_at, family_members(id, name)")
    .eq("owner_id", adminProfile.owner_id)
    .or(organizationOrLegacyFilter(organizationId))
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawProfile[]).map(normalizeProfile);
}

export async function getFamilyPermissions(adminProfileParam?: DbProfile, organizationIdParam?: string) {
  const supabase = await createClient();
  const adminProfile = adminProfileParam ?? (await requireAdminProfile());
  const organizationId = organizationIdParam ?? (await requireOrganizationAccess()).organization.id;

  const { data, error } = await supabase
    .from("user_module_permissions")
    .select("id, owner_id, organization_id, profile_id, module, can_view, can_create, can_edit, can_delete, scope, allowed_member_ids, granted_by, created_at")
    .eq("owner_id", adminProfile.owner_id)
    .or(organizationOrLegacyFilter(organizationId));

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
  const adminProfile = adminProfileParam ?? (await requireAdminProfile());
  const organizationId = organizationIdParam ?? (await requireOrganizationAccess()).organization.id;

  const { data, error } = await supabase
    .from("user_feature_permissions")
    .select("id, owner_id, organization_id, profile_id, feature_key, is_enabled, granted_by, created_at")
    .eq("owner_id", adminProfile.owner_id)
    .or(organizationOrLegacyFilter(organizationId));

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
