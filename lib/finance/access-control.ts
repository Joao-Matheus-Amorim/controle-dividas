import { redirect } from "next/navigation";

import { linkAuthUserToFamilyProfile } from "@/lib/finance/profile-linking";
import { requireOrganizationAccess } from "@/lib/organizations/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FeaturePermissionKey, FinanceModuleKey, PermissionAction } from "./permissions";

export type CurrentProfile = {
  id: string;
  owner_id: string;
  organization_id: string | null;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
  name: string;
  email: string | null;
  role: "admin" | "adult" | "child" | "custom" | "user";
  is_active: boolean;
};

type ModulePermission = {
  profile_id: string;
  organization_id: string | null;
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
  organization_id: string | null;
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

async function getActiveOrganizationId(orgSlug?: string) {
  const { organization } = await requireOrganizationAccess(orgSlug);
  return organization.id;
}

async function getProfileByAuthUserId(authUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, owner_id, organization_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
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
    .select("id, owner_id, organization_id, auth_user_id, linked_family_member_id, name, email, role, is_active")
    .ilike("email", normalizedEmail)
    .limit(2);

  if (error) {
    throw new Error(error.message);
  }

  const profiles = (data ?? []) as CurrentProfile[];

  if (profiles.length > 1) {
    throw new Error("duplicate_authorized_email");
  }

  return profiles[0] ?? null;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  const existingProfile = await getProfileByAuthUserId(user.id);

  if (existingProfile) {
    return existingProfile;
  }

  let authorizedProfile: CurrentProfile | null = null;

  try {
    authorizedProfile = await getProfileByAuthorizedEmail(user.email);
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate_authorized_email") {
      redirect("/auth/error?error=Este email esta autorizado em mais de uma organizacao. Fale com o Admin familiar para corrigir o acesso.");
    }

    throw error;
  }

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

  redirect("/onboarding/organizacao");
}

async function getAllActiveMemberIds(organizationId: string) {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("family_members")
    .select("id")
    .eq("is_active", true)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((member) => String(member.id));
}

export async function getModulePermission(
  profileId: string,
  module: FinanceModuleKey,
  organizationIdParam?: string,
) {
  const adminSupabase = createAdminClient();
  const organizationId = organizationIdParam ?? (await getActiveOrganizationId());

  const { data, error } = await adminSupabase
    .from("user_module_permissions")
    .select("profile_id, organization_id, module, can_view, can_create, can_edit, can_delete, scope, allowed_member_ids")
    .eq("profile_id", profileId)
    .eq("module", module)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ModulePermission | null;
}

export async function getFeaturePermission(
  profileId: string,
  featureKey: FeaturePermissionKey,
  organizationIdParam?: string,
) {
  const adminSupabase = createAdminClient();
  const organizationId = organizationIdParam ?? (await getActiveOrganizationId());

  const { data, error } = await adminSupabase
    .from("user_feature_permissions")
    .select("profile_id, organization_id, feature_key, is_enabled")
    .eq("profile_id", profileId)
    .eq("feature_key", featureKey)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as FeaturePermission | null;
}

export async function canUseFeature(featureKey: FeaturePermissionKey, orgSlug?: string) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  const organizationId = await getActiveOrganizationId(orgSlug);
  const permission = await getFeaturePermission(profile.id, featureKey, organizationId);
  return Boolean(permission?.is_enabled);
}

export async function canViewModule(module: FinanceModuleKey, orgSlug?: string) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return false;
  }

  if (profile.role === "admin") {
    return true;
  }

  const organizationId = await getActiveOrganizationId(orgSlug);
  const permission = await getModulePermission(profile.id, module, organizationId);
  return Boolean(permission?.can_view);
}

export async function getVisibleModuleKeys(modules: FinanceModuleKey[], orgSlug?: string) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return [];
  }

  if (profile.role === "admin") {
    return modules;
  }

  const adminSupabase = createAdminClient();
  const organizationId = await getActiveOrganizationId(orgSlug);
  const { data, error } = await adminSupabase
    .from("user_module_permissions")
    .select("module, can_view, organization_id")
    .eq("profile_id", profile.id)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  const permissions = (data ?? []) as Pick<ModulePermission, "module" | "can_view" | "organization_id">[];
  return modules.filter((module) => {
    const scopedPermission = permissions.find((permission) => permission.module === module);
    return Boolean(scopedPermission?.can_view);
  });
}

export async function getAccessibleMemberIds(
  module: FinanceModuleKey,
  action: PermissionAction = "can_view",
  orgSlug?: string,
) {
  const profile = await getCurrentProfile();

  if (!profile.is_active) {
    return [];
  }

  const organizationId = await getActiveOrganizationId(orgSlug);

  if (profile.role === "admin") {
    return getAllActiveMemberIds(organizationId);
  }

  const permission = await getModulePermission(profile.id, module, organizationId);

  if (!permission || !permission[action]) {
    return [];
  }

  if (permission.scope === "family") {
    return getAllActiveMemberIds(organizationId);
  }

  if (permission.scope === "selected") {
    const activeMemberIds = await getAllActiveMemberIds(organizationId);
    return (permission.allowed_member_ids ?? []).filter((memberId) => activeMemberIds.includes(memberId));
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
