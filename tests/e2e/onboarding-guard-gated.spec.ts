import { expect, test } from "@playwright/test";

import {
  getOnboardingCaseE2eConfig,
  shouldRunOnboardingCaseE2e,
} from "./helpers/e2e-env";

const onboardingCaseConfig = getOnboardingCaseE2eConfig();
const runOnboardingCaseE2e = shouldRunOnboardingCaseE2e();
const onboardingCaseTest = runOnboardingCaseE2e ? test : test.skip;

test.describe("authenticated onboarding guard E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled onboarding guard E2E variables are incomplete", () => {
    if (!onboardingCaseConfig.enabled) {
      expect(runOnboardingCaseE2e).toBe(false);
      expect(onboardingCaseConfig.missingVariables).toEqual([]);
      return;
    }

    expect(onboardingCaseConfig.missingVariables).toEqual([]);
    expect(runOnboardingCaseE2e).toBe(true);
  });

  onboardingCaseTest("shows the expected onboarding guard message", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(onboardingCaseConfig.email!);
    await page.getByLabel("Senha").fill(onboardingCaseConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.locator("#organization_name")).toBeVisible();
    await expect(page.locator("#organization_slug")).toBeVisible();

    await page.locator("#organization_name").fill("E2E Onboarding Guard Organization");
    await page.locator("#organization_slug").fill(onboardingCaseConfig.slug!);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Este slug já está em uso.")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.getByRole("heading", { name: "Crie sua organizacao financeira" })).toBeVisible();
  });
});
