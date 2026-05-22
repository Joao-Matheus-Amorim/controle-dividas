import { expect, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";
import {
  cleanupPayableBillsByNameMarker,
  createE2eRunMarker,
} from "./helpers/data-changing-cleanup";

const config = getDataChangingE2eConfig();
const runE2e = shouldRunDataChangingE2e();
const payableTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("payable");
const payableName = `${marker} Payable`;

test.describe("data-changing create payable E2E contract", () => {
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

    await cleanupPayableBillsByNameMarker(marker);
  });

  test.afterEach(async () => {
    if (!runE2e) {
      return;
    }

    await cleanupPayableBillsByNameMarker(marker);
  });

  payableTest("creates a marked payable bill", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await page.goto("/protected/contas-a-pagar");

    await page.getByRole("button", { name: "Nova conta/divida" }).click();

    const responsibleSelect = page.locator("select[name='responsible_member_id']");
    await expect
      .poll(async () => responsibleSelect.locator("option").count(), { timeout: 15_000 })
      .toBeGreaterThan(1);
    await responsibleSelect.selectOption({ index: 1 });

    await page.getByLabel("Nome da conta/divida").fill(payableName);
    await page.getByLabel("Categoria").selectOption("Outros");
    await page.getByLabel("Valor em euro").fill("1.00");
    await page.getByLabel("Status").selectOption("pendente");
    await page.getByLabel("Banco utilizado").fill("E2E");
    await page.getByLabel("Observacao").fill(marker);
    await page.getByRole("button", { name: "Cadastrar conta avulsa" }).click();

    await expect(page.getByText("Conta avulsa cadastrada com sucesso.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(payableName)).toBeVisible({ timeout: 15_000 });
  });
});
