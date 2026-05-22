import { expect, test } from "@playwright/test";

import {
  getLimitedUserExpectationE2eConfig,
  shouldRunLimitedUserExpectationE2e,
} from "./helpers/e2e-env";

const limitedUserConfig = getLimitedUserExpectationE2eConfig();
const runLimitedUserExpectationE2e = shouldRunLimitedUserExpectationE2e();
const limitedUserNavigationTest = runLimitedUserExpectationE2e ? test : test.skip;

test.describe("limited-user hidden module navigation E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled limited-user expectation E2E variables are incomplete", () => {
    if (!limitedUserConfig.enabled) {
      expect(runLimitedUserExpectationE2e).toBe(false);
      expect(limitedUserConfig.missingVariables).toEqual([]);
      return;
    }

    expect(limitedUserConfig.missingVariables).toEqual([]);
    expect(runLimitedUserExpectationE2e).toBe(true);
  });

  limitedUserNavigationTest("does not show navigation for a denied module", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(limitedUserConfig.email!);
    await page.getByLabel("Senha").fill(limitedUserConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);

    await expect(
      page.getByRole("link", { name: limitedUserConfig.hiddenNavLabel! }),
    ).toHaveCount(0);
  });
});
