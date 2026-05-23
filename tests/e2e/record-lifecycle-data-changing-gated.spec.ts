import { expect, test } from "@playwright/test";

import {
  cleanupBankAccountsByNotesMarker,
  createE2eRunMarker,
} from "./helpers/data-changing-cleanup";
import {
  getRecordLifecycleE2eConfig,
  shouldRunRecordLifecycleE2e,
} from "./helpers/record-lifecycle-env";

const config = getRecordLifecycleE2eConfig();
const runE2e = shouldRunRecordLifecycleE2e();
const lifecycleTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("record-lifecycle");
const accountName = `${marker} Account`;

test.describe("data-changing record lifecycle E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled record lifecycle E2E variables are incomplete", () => {
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

  lifecycleTest("creates and removes a marked bank account", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await page.goto("/protected/bancos");

    await page.getByRole("button", { name: "Novo banco" }).click();

    const createMemberSelect = page.locator("select[name='family_member_id']");
    await expect
      .poll(async () => createMemberSelect.locator("option").count(), { timeout: 15_000 })
      .toBeGreaterThan(1);
    await createMemberSelect.selectOption({ index: 1 });

    await page.getByLabel("Nome do banco").fill(accountName);
    await page.getByLabel("Saldo atual").fill("1.00");
    await page.getByLabel("Moeda").fill("EUR");
    await page.getByLabel("Observacao").fill(marker);
    await page.getByRole("button", { name: "Cadastrar banco" }).click();

    await expect(page.getByText("Banco cadastrado com sucesso.")).toBeVisible({ timeout: 15_000 });
    await page.goto("/protected/bancos");
    await expect(page.getByText(accountName, { exact: true })).toBeVisible({ timeout: 15_000 });

    const accountCard = page
      .getByText(accountName, { exact: true })
      .locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");

    await accountCard.getByRole("button", { name: "Excluir banco" }).click();
    await expect(page.getByText(accountName, { exact: true })).not.toBeVisible({ timeout: 15_000 });
  });
});
