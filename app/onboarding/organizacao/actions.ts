"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InitialOrganizationOnboardingState = {
  error?: string;
  success?: string;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeOrganizationSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

async function validateCurrentUserEligibility(slug: string) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const authUserId = authData?.claims?.sub ? String(authData.claims.sub) : null;

  if (authError || !authUserId) {
    return { error: "Faça login para continuar o onboarding." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (!profile) {
    return { error: "Perfil não encontrado para este usuário." };
  }

  if (!profile.is_active) {
    return { error: "Seu perfil está inativo." };
  }

  const { data: memberships, error: membershipError } = await supabase
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

  return { authUserId };
}

async function createInitialOrganization({
  authUserId,
  name,
  slug,
}: {
  authUserId: string;
  name: string;
  slug: string;
}) {
  const adminSupabase = createAdminClient();

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
    return {
      error:
        organizationError?.message ?? "Não foi possível criar a organização.",
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
    await adminSupabase.from("organizations").delete().eq("id", organization.id);
    return { error: membershipError.message };
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
    name,
    slug,
  });
}
