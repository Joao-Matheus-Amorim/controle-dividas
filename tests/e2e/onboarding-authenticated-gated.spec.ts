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
  });
});
