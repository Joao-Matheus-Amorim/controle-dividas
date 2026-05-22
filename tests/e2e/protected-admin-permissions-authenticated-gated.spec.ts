import { expect, test } from "@playwright/test";

import {
  getAdminE2eConfig,
  shouldRunAdminE2e,
} from "./helpers/e2e-env";

const adminConfig = getAdminE2eConfig();
const runAdminE2e = shouldRunAdminE2e();
const adminPermissionsRouteTest = runAdminE2e ? test : test.skip;

test.describe("authenticated protected admin permissions route E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled admin E2E variables are incomplete", () => {
    if (!adminConfig.enabled) {
      expect(runAdminE2e).toBe(false);
      expect(adminConfig.missingVariables).toEqual([]);
      return;
    }

    expect(adminConfig.missingVariables).toEqual([]);
    expect(runAdminE2e).toBe(true);
  });

  adminPermissionsRouteTest("opens the admin permissions route without redirecting away from the protected app", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(adminConfig.email!);
    await page.getByLabel("Senha").fill(adminConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);

    await page.goto("/protected/admin/permissoes");

    await expect(page).toHaveURL(/\/protected\/admin\/permissoes(?:\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.getByRole("heading", { name: "Permissões" })).toBeVisible();
    await expect(page.getByText("Acessos por módulo")).toBeVisible();
  });
});
