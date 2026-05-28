import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  getMultiOrgSwitchE2eConfig,
  shouldRunMultiOrgSwitchE2e,
} from "./helpers/e2e-env";

const multiOrgSwitchConfig = getMultiOrgSwitchE2eConfig();
const runMultiOrgSwitchE2e = shouldRunMultiOrgSwitchE2e();
const multiOrgSwitchTest = runMultiOrgSwitchE2e ? test : test.skip;
const multiOrgSwitchSlugPrefix = "e2e-multi-org-switch-";
const multiOrgSwitchProfileName = "E2E Multi Org Switch Profile";

type OrganizationFixture = {
  id: string;
  name: string;
  slug: string;
};

function createMultiOrgSwitchAdminClient() {
  return createClient(
    multiOrgSwitchConfig.supabaseUrl!,
    multiOrgSwitchConfig.serviceRoleKey!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function findMultiOrgSwitchUserIdByEmail() {
  const admin = createMultiOrgSwitchAdminClient();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === multiOrgSwitchConfig.email!.toLowerCase(),
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

async function cleanupMultiOrgSwitchOrganizations(userId: string) {
  const admin = createMultiOrgSwitchAdminClient();
  const { data: organizations, error: organizationsError } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_auth_user_id", userId)
    .like("slug", `${multiOrgSwitchSlugPrefix}%`);

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

async function ensureMultiOrgSwitchProfile(userId: string, organizationId: string) {
  const admin = createMultiOrgSwitchAdminClient();
  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id, is_active")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  if (existingProfile) {
    if (!existingProfile.is_active) {
      throw new Error("The multi-org E2E user profile is inactive.");
    }

    return;
  }

  const { error: profileError } = await admin.from("profiles").insert({
    owner_id: userId,
    auth_user_id: userId,
    organization_id: organizationId,
    name: multiOrgSwitchProfileName,
    email: multiOrgSwitchConfig.email,
    role: "admin",
    is_active: true,
  });

  if (profileError) {
    throw profileError;
  }
}

async function createMultiOrgSwitchOrganizations() {
  const admin = createMultiOrgSwitchAdminClient();
  const userId = await findMultiOrgSwitchUserIdByEmail();

  if (!userId) {
    throw new Error("E2E multi-org switch user was not found.");
  }

  await cleanupMultiOrgSwitchOrganizations(userId);

  try {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const organizationRows = [
      {
        slug: `${multiOrgSwitchSlugPrefix}primary-${suffix}`,
        name: "E2E Multi Org Primary",
        owner_auth_user_id: userId,
        plan: "free",
        status: "active",
      },
      {
        slug: `${multiOrgSwitchSlugPrefix}secondary-${suffix}`,
        name: "E2E Multi Org Secondary",
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
      throw new Error("Expected two multi-org E2E organizations to be created.");
    }

    const [primaryOrganization, secondaryOrganization] = createdOrganizations as [
      OrganizationFixture,
      OrganizationFixture,
    ];

    const { error: membershipsError } = await admin.from("organization_memberships").insert(
      [primaryOrganization, secondaryOrganization].map((organization) => ({
        organization_id: organization.id,
        auth_user_id: userId,
        role: "owner",
        is_active: true,
      })),
    );

    if (membershipsError) {
      throw membershipsError;
    }

    await ensureMultiOrgSwitchProfile(userId, primaryOrganization.id);

    return {
      userId,
      organizations: [primaryOrganization, secondaryOrganization] as const,
    };
  } catch (error) {
    await cleanupMultiOrgSwitchOrganizations(userId);
    throw error;
  }
}

test.describe("authenticated multi-org switch E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled multi-org switch E2E variables are incomplete", () => {
    if (!multiOrgSwitchConfig.enabled) {
      expect(runMultiOrgSwitchE2e).toBe(false);
      expect(multiOrgSwitchConfig.missingVariables).toEqual([]);
      return;
    }

    expect(multiOrgSwitchConfig.missingVariables).toEqual([]);
    expect(runMultiOrgSwitchE2e).toBe(true);
  });

  multiOrgSwitchTest("persists active organization switching across reloads", async ({ page }) => {
    const fixture = await createMultiOrgSwitchOrganizations();
    const [primaryOrganization, secondaryOrganization] = fixture.organizations;

    try {
      await page.goto("/auth/login");
      await page.getByLabel("Email").fill(multiOrgSwitchConfig.email!);
      await page.getByLabel("Senha").fill(multiOrgSwitchConfig.password!);
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
      await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);

      const organizationSelect = page.locator('select[name="organization_id"]').first();
      await expect(organizationSelect).toBeVisible({ timeout: 15_000 });
      await expect(
        page.locator('select[name="organization_id"] option', { hasText: primaryOrganization.name }),
      ).toHaveCount(1);
      await expect(
        page.locator('select[name="organization_id"] option', { hasText: secondaryOrganization.name }),
      ).toHaveCount(1);

      await organizationSelect.selectOption(primaryOrganization.id);
      await page.getByRole("button", { name: "Trocar" }).click();
      await page.reload();
      await expect(organizationSelect).toHaveValue(primaryOrganization.id, { timeout: 15_000 });

      await organizationSelect.selectOption(secondaryOrganization.id);
      await page.getByRole("button", { name: "Trocar" }).click();
      await page.reload();
      await expect(organizationSelect).toHaveValue(secondaryOrganization.id, { timeout: 15_000 });
    } finally {
      await cleanupMultiOrgSwitchOrganizations(fixture.userId);
    }
  });
});
