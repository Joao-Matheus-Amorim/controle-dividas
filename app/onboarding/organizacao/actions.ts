"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InitialOrganizationOnboardingState = {
  error?: string;
  success?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

type OnboardingProfile = {
  id: string;
  is_active: boolean;
  organization_id: string | null;
};

type OnboardingEligibility = {
  authUserId: string;
  email: string | null;
  profile: OnboardingProfile | null;
};

function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitialOnboardingProfileName(email: string | null) {
  const localPart = email?.split("@")[0]?.trim();
  return localPart || "Usuario";
}

function isUniqueConstraintError(message: string) {
  return message.toLowerCase().includes("duplicate key value");
}

async function validateOrganizationSlugAvailability(slug: string) {
  const adminSupabase = createAdminClient();

  const { data: existingOrganization, error } = await adminSupabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (existingOrganization) {
    return { error: "Este slug já está em uso." };
  }

  return null;
}

async function getOnboardingProfile({
  adminSupabase,
  authUserId,
}: {
  adminSupabase: AdminSupabaseClient;
  authUserId: string;
}) {
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, is_active, organization_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (profile && !profile.is_active) {
    return { error: "Seu perfil está inativo." };
  }

  return { profile: (profile ?? null) as OnboardingProfile | null };
}

async function ensureInitialOnboardingProfile({
  adminSupabase,
  authUserId,
  email,
  organizationId,
  existingProfile,
}: {
  adminSupabase: AdminSupabaseClient;
  authUserId: string;
  email: string | null;
  organizationId: string;
  existingProfile: OnboardingProfile | null;
}) {
  if (existingProfile) {
    const { error: updateProfileError } = await adminSupabase
      .from("profiles")
      .update({ organization_id: organizationId })
      .eq("id", existingProfile.id)
      .eq("auth_user_id", authUserId)
      .eq("is_active", true);

    if (updateProfileError) {
      return { error: updateProfileError.message };
    }

    return null;
  }

  const { error: createProfileError } = await adminSupabase
    .from("profiles")
    .insert({
      owner_id: authUserId,
      auth_user_id: authUserId,
      organization_id: organizationId,
      name: getInitialOnboardingProfileName(email),
      email,
      role: "admin",
      is_active: true,
    });

  if (createProfileError) {
    return { error: createProfileError.message };
  }

  return null;
}

async function validateCurrentUserEligibility(slug: string) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const authUserId = authData?.claims?.sub ? String(authData.claims.sub) : null;
  const email = typeof authData?.claims?.email === "string" ? authData.claims.email : null;

  if (authError || !authUserId) {
    return { error: "Faça login para continuar o onboarding." };
  }

  const adminSupabase = createAdminClient();
  const profileResult = await getOnboardingProfile({
    adminSupabase,
    authUserId,
  });

  if ("error" in profileResult) {
    return profileResult;
  }

  const { data: memberships, error: membershipError } = await adminSupabase
    .from("organization_memberships")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .limit(1);

  if (membershipError) {
    return { error: membershipError.message };
  }

  if ((memberships ?? []).length > 0) {
    return { error: "Você já possui uma organização ativa." };
  }

  const slugError = await validateOrganizationSlugAvailability(slug);

  if (slugError) {
    return slugError;
  }

  return {
    authUserId,
    email,
    profile: profileResult.profile,
  } satisfies OnboardingEligibility;
}

async function rollbackInitialOrganization(
  adminSupabase: AdminSupabaseClient,
  organizationId: string,
) {
  await adminSupabase.from("organizations").delete().eq("id", organizationId);
}

async function createInitialOrganization({
  authUserId,
  email,
  profile,
  name,
  slug,
}: OnboardingEligibility & {
  name: string;
  slug: string;
}) {
  const adminSupabase = createAdminClient();

  const { data: existingMemberships, error: existingMembershipsError } = await adminSupabase
    .from("organization_memberships")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .limit(1);

  if (existingMembershipsError) {
    return { error: existingMembershipsError.message };
  }

  if ((existingMemberships ?? []).length > 0) {
    return { error: "Você já possui uma organização ativa." };
  }

  const { data: organization, error: organizationError } = await adminSupabase
    .from("organizations")
    .insert({
      slug,
      name,
      owner_auth_user_id: authUserId,
      plan: "free",
      status: "active",
    })
    .select("id")
    .single();

  if (organizationError || !organization?.id) {
    const message = organizationError?.message ?? "Não foi possível criar a organização.";

    return {
      error: isUniqueConstraintError(message) ? "Este slug já está em uso." : message,
    };
  }

  const { error: membershipError } = await adminSupabase
    .from("organization_memberships")
    .insert({
      organization_id: organization.id,
      auth_user_id: authUserId,
      role: "owner",
      is_active: true,
    });

  if (membershipError) {
    await rollbackInitialOrganization(adminSupabase, organization.id);

    return {
      error: isUniqueConstraintError(membershipError.message)
        ? "Você já possui uma organização ativa."
        : membershipError.message,
    };
  }

  const profileError = await ensureInitialOnboardingProfile({
    adminSupabase,
    authUserId,
    email,
    organizationId: organization.id,
    existingProfile: profile,
  });

  if (profileError) {
    await rollbackInitialOrganization(adminSupabase, organization.id);

    return profileError;
  }

  return { success: "Organização criada com sucesso." };
}

export async function createInitialOrganizationFromOnboarding(
  _prevState: InitialOrganizationOnboardingState,
  formData: FormData,
): Promise<InitialOrganizationOnboardingState> {
  const name = String(formData.get("organization_name") ?? "").trim();
  const rawSlug = String(formData.get("organization_slug") ?? "").trim();
  const slug = rawSlug ? normalizeOrganizationSlug(rawSlug) : normalizeOrganizationSlug(name);

  if (!name) {
    return { error: "Informe o nome da organização." };
  }

  if (name.length < 3) {
    return { error: "O nome da organização deve ter pelo menos 3 caracteres." };
  }

  if (!slug) {
    return { error: "Informe um slug válido para a organização." };
  }

  if (!slugPattern.test(slug)) {
    return { error: "Use apenas letras minúsculas, números e hífens no slug." };
  }

  const eligibility = await validateCurrentUserEligibility(slug);

  if ("error" in eligibility) {
    return eligibility;
  }

  return createInitialOrganization({
    authUserId: eligibility.authUserId,
    email: eligibility.email,
    profile: eligibility.profile,
    name,
    slug,
  });
}
