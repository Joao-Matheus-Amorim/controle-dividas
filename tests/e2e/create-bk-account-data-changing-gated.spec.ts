import { expect, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";
import {
  cleanupBankAccountsByNotesMarker,
  createE2eRunMarker,
} from "./helpers/data-changing-cleanup";

const config = getDataChangingE2eConfig();
const runE2e = shouldRunDataChangingE2e();
const bkAccountTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("bk-account");
const accountName = `${marker} Account`;

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

  test.beforeEach(async () => {
    if (!runE2e) {
      return;
    }

    await cleanupBankAccountsByNotesMarker(marker);
  });

  test.afterEach(async () => {
    if (!runE2e) {
      return;
    }

    await cleanupBankAccountsByNotesMarker(marker);
  });

  bkAccountTest("creates a marked bank account", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await page.goto("/protected/bancos");

    await page.getByRole("button", { name: "Novo banco" }).click();

    const memberSelect = page.locator("select[name='family_member_id']");
    await expect
      .poll(async () => memberSelect.locator("option").count(), { timeout: 15_000 })
      .toBeGreaterThan(1);
    await memberSelect.selectOption({ index: 1 });

    await page.getByLabel("Nome do banco").fill(accountName);
    await page.getByLabel("Saldo atual").fill("1.00");
    await page.getByLabel("Moeda").fill("EUR");
    await page.getByLabel("Observacao").fill(marker);
    await page.getByRole("button", { name: "Cadastrar banco" }).click();

    await expect(page.getByText("Banco cadastrado com sucesso.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(accountName, { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(marker, { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
