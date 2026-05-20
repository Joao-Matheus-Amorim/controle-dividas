import { expect, test } from "@playwright/test";

import {
  createE2eSlug,
  getOnboardingE2eConfig,
  shouldRunOnboardingE2e,
} from "./helpers/e2e-env";

const onboardingConfig = getOnboardingE2eConfig();
const runOnboardingE2e = shouldRunOnboardingE2e();
const onboardingTest = runOnboardingE2e ? test : test.skip;

test.describe("authenticated onboarding E2E contract", () => {
  test("is gated by dedicated onboarding E2E variables", () => {
    expect(runOnboardingE2e ? onboardingConfig.missingVariables : []).toEqual([]);
  });

  onboardingTest("redirects a dedicated authenticated user without active organization to onboarding", async ({ page }) => {
    const slug = createE2eSlug();

    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(onboardingConfig.email!);
    await page.getByLabel("Senha").fill(onboardingConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.locator("#organization_name")).toBeVisible();
    await expect(page.locator("#organization_slug")).toBeVisible();

    await page.locator("#organization_name").fill("E2E Onboarding Organization");
    await page.locator("#organization_slug").fill(slug);

    await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
  });
});
