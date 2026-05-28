import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  createE2eSlug,
  getOnboardingE2eConfig,
  shouldRunOnboardingE2e,
} from "./helpers/e2e-env";

const onboardingConfig = getOnboardingE2eConfig();
const runOnboardingE2e = shouldRunOnboardingE2e();
const onboardingTest = runOnboardingE2e ? test : test.skip;
const onboardingSlugPrefix = "e2e-onboarding-";

function createOnboardingCleanupClient() {
  return createClient(
    onboardingConfig.supabaseUrl!,
    onboardingConfig.serviceRoleKey!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function findOnboardingUserIdByEmail() {
  const admin = createOnboardingCleanupClient();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === onboardingConfig.email!.toLowerCase(),
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

async function cleanupOnboardingOrganizations() {
  const admin = createOnboardingCleanupClient();
  const userId = await findOnboardingUserIdByEmail();

  if (!userId) {
    throw new Error("E2E onboarding user was not found.");
  }

  const { data: organizations, error: organizationsError } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_auth_user_id", userId)
    .like("slug", `${onboardingSlugPrefix}%`);

  if (organizationsError) {
    throw organizationsError;
  }

  const organizationIds = (organizations ?? []).map((organization) => organization.id);

  if (organizationIds.length === 0) {
    return;
  }

  const { error: membershipsError } = await admin
    .from("organization_memberships")
    .delete()
    .in("organization_id", organizationIds);

  if (membershipsError) {
    throw membershipsError;
  }

  const { error: profilesError } = await admin
    .from("profiles")
    .delete()
    .eq("auth_user_id", userId)
    .in("organization_id", organizationIds);

  if (profilesError) {
    throw profilesError;
  }

  const { error: organizationsDeleteError } = await admin
    .from("organizations")
    .delete()
    .in("id", organizationIds);

  if (organizationsDeleteError) {
    throw organizationsDeleteError;
  }
}

test.describe("authenticated onboarding E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled onboarding E2E variables are incomplete", () => {
    if (!onboardingConfig.enabled) {
      expect(runOnboardingE2e).toBe(false);
      expect(onboardingConfig.missingVariables).toEqual([]);
      return;
    }

    expect(onboardingConfig.missingVariables).toEqual([]);
    expect(runOnboardingE2e).toBe(true);
  });

  onboardingTest("creates the initial organization and enters the protected app", async ({ page }) => {
    const slug = createE2eSlug();

    await cleanupOnboardingOrganizations();

    try {
      await page.goto("/auth/login");
      await page.getByLabel("Email").fill(onboardingConfig.email!);
      await page.getByLabel("Senha").fill(onboardingConfig.password!);
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page).toHaveURL(/\/onboarding\/organizacao/);
      await expect(page.locator("#organization_name")).toBeVisible();
      await expect(page.locator("#organization_slug")).toBeVisible();

      await page.locator("#organization_name").fill("E2E Onboarding Organization");
      await page.locator("#organization_slug").fill(slug);
      await page.getByRole("button", { name: "Continuar" }).click();

      await expect(page.getByText("Organização criada com sucesso.")).toBeVisible({ timeout: 15_000 });

      await page.getByRole("link", { name: "Voltar para o app" }).click();

      await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
      await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);
      await expect(page.getByRole("heading", { name: "Visão do mês" })).toBeVisible();
    } finally {
      await cleanupOnboardingOrganizations();
    }
  });
});
