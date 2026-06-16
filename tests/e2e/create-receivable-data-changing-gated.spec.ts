import { expect, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";
import {
  cleanupReceivableIncomesByNotesMarker,
  createE2eRunMarker,
} from "./helpers/data-changing-cleanup";

const config = getDataChangingE2eConfig();
const runE2e = shouldRunDataChangingE2e();
const receivableTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("receivable");
const receivingBank = `${marker} Bank`;

test.describe("data-changing create receivable E2E contract", () => {
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

    await cleanupReceivableIncomesByNotesMarker(marker);
  });

  test.afterEach(async () => {
    if (!runE2e) {
      return;
    }

    await cleanupReceivableIncomesByNotesMarker(marker);
  });

  receivableTest("creates a marked receivable income", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await page.goto("/protected/contas-a-receber");

    await page.getByRole("button", { name: "Nova entrada" }).click();

    const receiverSelect = page.locator("select[name='receiver_member_id']");
    await expect
      .poll(async () => receiverSelect.locator("option").count(), { timeout: 15_000 })
      .toBeGreaterThan(1);
    await receiverSelect.selectOption({ index: 1 });

    await page.getByLabel("Entrada de dinheiro").selectOption("Outros");
    await page.getByLabel("Valor em euro").fill("1.00");
    await page.getByLabel("Banco de recebimento").fill(receivingBank);
    await page.getByLabel("Observação").fill(marker);
    await page.getByRole("button", { name: "Cadastrar entrada" }).click();

    await expect(page.getByText("Conta a receber cadastrada com sucesso.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(receivingBank)).toBeVisible({ timeout: 15_000 });
  });
});
