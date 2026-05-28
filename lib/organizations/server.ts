import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORGANIZATION_COOKIE_NAME } from "./constants";
import type { Organization, OrganizationContext, OrganizationMembership } from "./types";

type CurrentUser = {
  id: string;
  email: string | null;
};

type OrganizationRow = Organization & {
  stripe_customer_id?: string | null;
};

async function getCurrentUser(): Promise<CurrentUser> {
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

function normalizeOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    owner_auth_user_id: row.owner_auth_user_id,
    plan: row.plan,
    status: row.status,
    trial_ends_at: row.trial_ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getDefaultOrganizationContext(contexts: OrganizationContext[]) {
  if (contexts.length === 0) {
    return null;
  }

  const ownedContext = contexts.find((context) => context.membership.role === "owner");

  if (ownedContext) {
    return ownedContext;
  }

  return contexts[0] ?? null;
}

async function getPreferredOrganizationId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value ?? null;

  return value && value.trim().length > 0 ? value : null;
}

async function getActiveOrganizationContext(contexts: OrganizationContext[]) {
  const preferredOrganizationId = await getPreferredOrganizationId();
  if (!preferredOrganizationId) {
    return getDefaultOrganizationContext(contexts);
  }

  const preferredContext = contexts.find(
    (context) =>
      context.organization.id === preferredOrganizationId ||
      context.organization.slug === preferredOrganizationId,
  );

  return preferredContext ?? getDefaultOrganizationContext(contexts);
}

function getOrganizationContextBySlug(
  contexts: OrganizationContext[],
  orgSlug: string,
) {
  return contexts.find((context) => context.organization.slug === orgSlug) ?? null;
}

export async function getCurrentOrganizationContext(
  organizationIdOrSlug?: string,
): Promise<OrganizationContext | null> {
  const contexts = await getUserOrganizations();

  if (!organizationIdOrSlug) {
    return getActiveOrganizationContext(contexts);
  }

  const bySlug = getOrganizationContextBySlug(contexts, organizationIdOrSlug);
  if (bySlug) {
    return bySlug;
  }

  return contexts.find((context) => context.organization.id === organizationIdOrSlug) ?? null;
}

export async function getUserOrganizations(): Promise<OrganizationContext[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_memberships")
    .select("id, organization_id, auth_user_id, role, is_active, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const activeMemberships = (memberships ?? []) as OrganizationMembership[];

  if (activeMemberships.length === 0) {
    return [];
  }

  const organizationIds = activeMemberships.map((membership) => membership.organization_id);

  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, slug, name, owner_auth_user_id, plan, status, trial_ends_at, created_at, updated_at")
    .in("id", organizationIds);

  if (organizationsError) {
    throw new Error(organizationsError.message);
  }

  const organizationById = new Map(
    ((organizations ?? []) as OrganizationRow[]).map((organization) => [
      organization.id,
      normalizeOrganization(organization),
    ]),
  );

  return activeMemberships
    .map((membership) => {
      const organization = organizationById.get(membership.organization_id);

      if (!organization) {
        return null;
      }

      return { organization, membership };
    })
    .filter((context): context is OrganizationContext => Boolean(context));
}

export async function getCurrentOrganization(orgSlug?: string) {
  return (await getCurrentOrganizationContext(orgSlug))?.organization ?? null;
}

export async function getCurrentMembership(organizationId?: string) {
  const contexts = await getUserOrganizations();

  if (organizationId) {
    return contexts.find((context) => context.membership.organization_id === organizationId)?.membership ?? null;
  }

  return (await getActiveOrganizationContext(contexts))?.membership ?? null;
}

export async function requireOrganizationAccess(orgSlug?: string) {
  const context = await getCurrentOrganizationContext(orgSlug);

  if (!context) {
    throw new Error("Voce nao tem acesso a esta organizacao.");
  }

  return context;
}

export async function requireOrganizationAdmin(orgSlug?: string) {
  const context = await requireOrganizationAccess(orgSlug);

  if (!context.membership.is_active || !["owner", "admin"].includes(context.membership.role)) {
    throw new Error("Voce nao tem permissao administrativa nesta organizacao.");
  }

  return context;
}
