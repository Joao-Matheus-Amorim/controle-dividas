import { expect, test } from "@playwright/test";

import {
  getDataChangingE2eConfig,
  shouldRunDataChangingE2e,
} from "./helpers/data-changing-env";
import {
  cleanupFamilyMembersByNameMarker,
  createE2eRunMarker,
} from "./helpers/data-changing-cleanup";

const config = getDataChangingE2eConfig();
const runDataChangingE2e = shouldRunDataChangingE2e();
const createMemberTest = runDataChangingE2e ? test : test.skip;
const marker = createE2eRunMarker("member");
const memberName = `${marker} Person`;

test.describe("data-changing create member E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled data-changing E2E variables are incomplete", () => {
    if (!config.enabled) {
      expect(runDataChangingE2e).toBe(false);
      expect(config.missingVariables).toEqual([]);
      return;
    }

    expect(config.missingVariables).toEqual([]);
    expect(runDataChangingE2e).toBe(true);
  });

  test.beforeEach(async () => {
    if (!runDataChangingE2e) {
      return;
    }

    await cleanupFamilyMembersByNameMarker(marker);
  });

  test.afterEach(async () => {
    if (!runDataChangingE2e) {
      return;
    }

    await cleanupFamilyMembersByNameMarker(marker);
  });

  createMemberTest("creates a marked family member", async ({ page }) => {
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
    await expect(page.getByText(memberName)).toBeVisible({ timeout: 15_000 });
  });
});
