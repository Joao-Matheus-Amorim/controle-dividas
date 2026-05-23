import { expect, type Page, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";
import { createE2eRunMarker } from "./helpers/data-changing-cleanup";

const config = getDataChangingE2eConfig();
const runE2e = shouldRunDataChangingE2e();
const bankTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("account");
const bankName = `${marker} Bank`;

async function clearMarkedBankAccount(page: Page) {
  await page.goto("/protected/bancos");

  const markedBank = page.getByText(bankName, { exact: true }).first();
  if ((await markedBank.count()) === 0) {
    return;
  }

  const bankCard = markedBank.locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");
  const actionButton = bankCard.locator("form").last().getByRole("button");

  await expect(actionButton).toBeVisible({ timeout: 15_000 });
  await actionButton.click();
  await expect(markedBank).not.toBeVisible({ timeout: 15_000 });
}

test.describe("data-changing create bank account E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled data-changing E2E variables are incomplete", () => {
    if (!config.enabled) {
      expect(runE2e).toBe(false);
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(config.missingVariables).toEqual([]);
    expect(runE2e).toBe(true);
  });

  bankTest("creates a marked bank account", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });

    await clearMarkedBankAccount(page);

    try {
      await page.getByRole("button", { name: "Novo banco" }).click();

      const memberSelect = page.locator("select[name='family_member_id']");
      await expect
        .poll(async () => memberSelect.locator("option").count(), { timeout: 15_000 })
        .toBeGreaterThan(1);
      await memberSelect.selectOption({ index: 1 });

      await page.getByLabel("Nome do banco").fill(bankName);
      await page.getByLabel("Saldo atual").fill("1.00");
      await page.getByLabel("Moeda").fill("EUR");
      await page.getByLabel("Observacao").fill(marker);
      await page.getByRole("button", { name: "Cadastrar banco" }).click();

      await expect(page.getByText("Banco cadastrado com sucesso.")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(bankName, { exact: true })).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(marker, { exact: true })).toBeVisible({ timeout: 15_000 });
    } finally {
      await clearMarkedBankAccount(page);
    }
  });
});
