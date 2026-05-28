import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  getOrgSlugE2eConfig,
  shouldRunOrgSlugE2e,
} from "./helpers/e2e-env";

const orgSlugConfig = getOrgSlugE2eConfig();
const runOrgSlugE2e = shouldRunOrgSlugE2e();
const orgSlugTest = runOrgSlugE2e ? test : test.skip;
const orgSlugPrefix = "e2e-orgslug-";
const orgSlugProfileName = "E2E OrgSlug Profile";

type OrganizationFixture = {
  id: string;
  name: string;
  slug: string;
};

function createOrgSlugAdminClient() {
  return createClient(
    orgSlugConfig.supabaseUrl!,
    orgSlugConfig.serviceRoleKey!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function findOrgSlugUserIdByEmail() {
  const admin = createOrgSlugAdminClient();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === orgSlugConfig.email!.toLowerCase(),
    );

    if (user) {
      return user.id;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function cleanupOrgSlugOrganizations(userId: string) {
  const admin = createOrgSlugAdminClient();
  const { data: organizations, error: organizationsError } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_auth_user_id", userId)
    .like("slug", `${orgSlugPrefix}%`);

  if (organizationsError) {
    throw organizationsError;
  }

  const organizationIds = (organizations ?? []).map((organization) => organization.id);

  if (organizationIds.length === 0) {
    return;
  }

  const { error: profilesError } = await admin
    .from("profiles")
    .delete()
    .eq("auth_user_id", userId)
    .in("organization_id", organizationIds);

  if (profilesError) {
    throw profilesError;
  }

  const { error: membershipsError } = await admin
    .from("organization_memberships")
    .delete()
    .in("organization_id", organizationIds);

  if (membershipsError) {
    throw membershipsError;
  }

  const { error: organizationsDeleteError } = await admin
    .from("organizations")
    .delete()
    .in("id", organizationIds);

  if (organizationsDeleteError) {
    throw organizationsDeleteError;
  }
}

async function ensureOrgSlugProfile(userId: string, organizationId: string) {
  const admin = createOrgSlugAdminClient();
  const { data: existingProfiles, error: existingProfilesError } = await admin
    .from("profiles")
    .select("id, organization_id, is_active")
    .eq("auth_user_id", userId)
    .limit(2);

  if (existingProfilesError) {
    throw existingProfilesError;
  }

  const profiles = existingProfiles ?? [];

  if (profiles.length > 1) {
    throw new Error("The orgSlug E2E user has more than one linked profile.");
  }

  const existingProfile = profiles[0];

  if (existingProfile) {
    if (!existingProfile.is_active) {
      throw new Error("The orgSlug E2E user profile is inactive.");
    }

    return;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    owner_id: userId,
    auth_user_id: userId,
    organization_id: organizationId,
    name: orgSlugProfileName,
    email: orgSlugConfig.email,
    role: "admin",
    is_active: true,
  });

  if (profileError) {
    throw profileError;
  }
}

async function createOrgSlugOrganizations() {
  const admin = createOrgSlugAdminClient();
  const userId = await findOrgSlugUserIdByEmail();

  if (!userId) {
    throw new Error("E2E orgSlug user was not found.");
  }

  await cleanupOrgSlugOrganizations(userId);

  try {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const organizationRows = [
      {
        slug: `${orgSlugPrefix}allowed-${suffix}`,
        name: "E2E OrgSlug Allowed",
        owner_auth_user_id: userId,
        plan: "free",
        status: "active",
      },
      {
        slug: `${orgSlugPrefix}denied-${suffix}`,
        name: "E2E OrgSlug Denied",
        owner_auth_user_id: userId,
        plan: "free",
        status: "active",
      },
    ];

    const { data: organizations, error: organizationsError } = await admin
      .from("organizations")
      .insert(organizationRows)
      .select("id, name, slug");

    if (organizationsError) {
      throw organizationsError;
    }

    const createdOrganizations = (organizations ?? []) as OrganizationFixture[];

    if (createdOrganizations.length !== 2) {
      throw new Error("Expected two orgSlug E2E organizations to be created.");
    }

    const [allowedOrganization, deniedOrganization] = createdOrganizations as [
      OrganizationFixture,
      OrganizationFixture,
    ];

    const { error: membershipsError } = await admin
      .from("organization_memberships")
      .insert({
        organization_id: allowedOrganization.id,
        auth_user_id: userId,
        role: "owner",
        is_active: true,
      });

    if (membershipsError) {
      throw membershipsError;
    }

    await ensureOrgSlugProfile(userId, allowedOrganization.id);

    return {
      userId,
      allowedOrganization,
      deniedOrganization,
    };
  } catch (error) {
    await cleanupOrgSlugOrganizations(userId);
    throw error;
  }
}

test.describe("authenticated orgSlug E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled orgSlug E2E variables are incomplete", () => {
    if (!orgSlugConfig.enabled) {
      expect(runOrgSlugE2e).toBe(false);
      expect(orgSlugConfig.missingVariables).toEqual([]);
      return;
    }

    expect(orgSlugConfig.missingVariables).toEqual([]);
    expect(runOrgSlugE2e).toBe(true);
  });

  orgSlugTest("opens allowed org routes and rejects an inaccessible slug", async ({ page }) => {
    const fixture = await createOrgSlugOrganizations();

    try {
      await page.goto("/auth/login");
      await page.getByLabel("Email").fill(orgSlugConfig.email!);
      await page.getByLabel("Senha").fill(orgSlugConfig.password!);
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });

      await page.goto(`/org/${fixture.allowedOrganization.slug}`);
      await expect(page).toHaveURL(
        new RegExp(`/org/${fixture.allowedOrganization.slug}(?:\\?|$)`),
        { timeout: 15_000 },
      );
      await expect(page.getByRole("heading", { name: "VisÃ£o do mÃªs" })).toBeVisible();

      await page.getByRole("link", { name: "Gastos" }).first().click();
      await expect(page).toHaveURL(
        new RegExp(`/org/${fixture.allowedOrganization.slug}/gastos(?:\\?|$)`),
        { timeout: 15_000 },
      );

      await page.goto(`/org/${fixture.deniedOrganization.slug}`);
      await expect(page).toHaveURL(
        new RegExp(`/org/${fixture.deniedOrganization.slug}(?:\\?|$)`),
        { timeout: 15_000 },
      );
      await expect(page.getByText("Voce nao tem acesso a esta organizacao.")).toBeVisible({
        timeout: 15_000,
      });

      await page.goto("/protected");
      await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "VisÃ£o do mÃªs" })).toBeVisible();
    } finally {
      await cleanupOrgSlugOrganizations(fixture.userId);
    }
  });
});
