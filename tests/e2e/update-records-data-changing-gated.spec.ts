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
const updateRecordsTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("update-records");
const initialAccountName = `${marker} Initial Account`;
const updatedAccountName = `${marker} Updated Account`;

test.describe("data-changing update records E2E contract", () => {
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

  updateRecordsTest("updates a marked bank account", async ({ page }) => {
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

    await page.getByLabel("Nome do banco").fill(initialAccountName);
    await page.getByLabel("Saldo atual").fill("1.00");
    await page.getByLabel("Moeda").fill("EUR");
    await page.getByLabel("Observacao").fill(marker);
    await page.getByRole("button", { name: "Cadastrar banco" }).click();

    await expect(page.getByText("Banco cadastrado com sucesso.")).toBeVisible({ timeout: 15_000 });
    await page.goto("/protected/bancos");
    await expect(page.getByText(initialAccountName, { exact: true })).toBeVisible({ timeout: 15_000 });

    const accountCard = page
      .getByText(initialAccountName, { exact: true })
      .locator("xpath=ancestor::div[contains(@class, 'rounded-2xl')][1]");

    await accountCard.getByRole("button", { name: "Editar banco" }).click();
    await expect(page.getByRole("heading", { name: "Editar banco" })).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Nome do banco").fill(updatedAccountName);
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    await expect(page.getByText("Banco atualizado com sucesso.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(updatedAccountName, { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
