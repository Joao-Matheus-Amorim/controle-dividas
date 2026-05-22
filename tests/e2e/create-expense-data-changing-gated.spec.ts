import { expect, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";
import {
  cleanupExpensesByDescriptionMarker,
  cleanupFamilyMembersByNameMarker,
  createE2eRunMarker,
} from "./helpers/data-changing-cleanup";

const config = getDataChangingE2eConfig();
const runE2e = shouldRunDataChangingE2e();
const expenseTest = runE2e ? test : test.skip;
const marker = createE2eRunMarker("expense");
const memberName = `${marker} Person`;
const description = `${marker} Expense`;

test.describe("data-changing create expense E2E contract", () => {
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

    await cleanupExpensesByDescriptionMarker(marker);
    await cleanupFamilyMembersByNameMarker(marker);
  });

  test.afterEach(async () => {
    if (!runE2e) {
      return;
    }

    await cleanupExpensesByDescriptionMarker(marker);
    await cleanupFamilyMembersByNameMarker(marker);
  });

  expenseTest("creates a marked expense", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(config.email!);
    await page.getByLabel("Senha").fill(config.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });

    await page.goto("/protected/pessoas");
    await page.getByRole("button", { name: "Nova pessoa" }).click();
    await page.getByLabel("Nome").fill(memberName);
    await page.getByLabel("Perfil").fill("E2E");
    await page.getByLabel("Limite mensal em euro").fill("10.00");
    await page.getByRole("button", { name: "Cadastrar pessoa" }).click();
    await expect(page.getByText("Pessoa cadastrada com sucesso.")).toBeVisible({ timeout: 15_000 });

    await page.goto("/protected/gastos");
    await page.getByRole("button", { name: "Novo gasto" }).click();
    await page.locator("select[name='family_member_id']").selectOption({ label: memberName });
    await page.getByLabel("Valor em euro").fill("1.00");
    await page.getByLabel("Descricao").fill(description);
    await page.getByRole("button", { name: "Cadastrar gasto" }).click();

    await expect(page.getByText("Gasto cadastrado com sucesso.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(description)).toBeVisible({ timeout: 15_000 });
  });
});
