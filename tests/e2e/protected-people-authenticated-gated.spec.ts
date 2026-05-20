import { expect, test } from "@playwright/test";

import {
  getActiveOrganizationE2eConfig,
  shouldRunActiveOrganizationE2e,
} from "./helpers/e2e-env";

const activeOrganizationConfig = getActiveOrganizationE2eConfig();
const runActiveOrganizationE2e = shouldRunActiveOrganizationE2e();
const peopleRouteTest = runActiveOrganizationE2e ? test : test.skip;

test.describe("authenticated protected people route E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled active organization E2E variables are incomplete", () => {
    if (!activeOrganizationConfig.enabled) {
      expect(runActiveOrganizationE2e).toBe(false);
      expect(activeOrganizationConfig.missingVariables).toEqual([]);
      return;
    }

    expect(activeOrganizationConfig.missingVariables).toEqual([]);
    expect(runActiveOrganizationE2e).toBe(true);
  });

  peopleRouteTest("opens the people route without redirecting away from the protected app", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(activeOrganizationConfig.email!);
    await page.getByLabel("Senha").fill(activeOrganizationConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);

    await page.goto("/protected/pessoas");

    await expect(page).toHaveURL(/\/protected\/pessoas(?:\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.getByRole("heading", { name: "Pessoas" })).toBeVisible();
    await expect(page.getByText("Membros, limites e acessos vinculados")).toBeVisible();
  });
});
