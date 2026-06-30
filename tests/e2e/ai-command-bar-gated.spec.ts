import { expect, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";

const config = getDataChangingE2eConfig();
const runE2e = shouldRunDataChangingE2e();
const aiTest = runE2e ? test : test.skip;

test.describe("AI command bar E2E contract", () => {
  test("fails when enabled data-changing E2E variables are incomplete", () => {
    if (!config.enabled) {
      expect(runE2e).toBe(false);
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(config.missingVariables).toEqual([]);
    expect(runE2e).toBe(true);
  });

  aiTest("renders command bar on dashboard and responds to expense input", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });

    const commandInput = page.getByPlaceholder("O que aconteceu?");
    await expect(commandInput).toBeVisible({ timeout: 10_000 });

    await commandInput.fill("paguei 50 no mercado hoje");
    await commandInput.press("Enter");

    await expect(page.getByRole("status")).toBeVisible({ timeout: 10_000 });
    const responseText = await page.getByRole("status").textContent();
    expect(responseText).toBeTruthy();
    expect(responseText?.toLowerCase()).toContain("gasto");
  });

  aiTest("command bar responds to payable fallback", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });

    const commandInput = page.getByPlaceholder("O que aconteceu?");
    await expect(commandInput).toBeVisible({ timeout: 10_000 });

    await commandInput.fill("conta de luz 120 vence amanha");
    await commandInput.press("Enter");

    await expect(page.getByRole("status")).toBeVisible({ timeout: 10_000 });
    const responseText = await page.getByRole("status").textContent();
    expect(responseText?.toLowerCase()).toContain("conta a pagar");
  });
});
