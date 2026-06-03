import { expect, test } from "@playwright/test";

import {
  getPostDeploySmokeE2eConfig,
  shouldRunPostDeploySmokeE2e,
} from "./helpers/e2e-env";

const postDeploySmokeConfig = getPostDeploySmokeE2eConfig();
const runPostDeploySmokeE2e = shouldRunPostDeploySmokeE2e();
const postDeploySmokeTest = runPostDeploySmokeE2e ? test : test.skip;

const protectedRoutes = [
  { path: "/protected", heading: /m[eê]s/i },
  { path: "/protected/gastos", heading: /^gastos$/i },
  { path: "/protected/contas-a-pagar", heading: /contas e dividas/i },
  { path: "/protected/contas-a-receber", heading: /contas a receber/i },
  { path: "/protected/bancos", heading: /^bancos$/i },
  { path: "/protected/configuracoes", heading: /configura/i },
] as const;

test.describe("post-deploy protected-route smoke E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled post-deploy smoke variables are incomplete", () => {
    if (!postDeploySmokeConfig.enabled) {
      expect(runPostDeploySmokeE2e).toBe(false);
      expect(postDeploySmokeConfig.missingVariables).toEqual([]);
      return;
    }

    expect(postDeploySmokeConfig.missingVariables).toEqual([]);
    expect(runPostDeploySmokeE2e).toBe(true);
  });

  postDeploySmokeTest("opens critical protected routes on the deployed app", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(postDeploySmokeConfig.email!);
    await page.getByLabel("Senha").fill(postDeploySmokeConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/protected(?:\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);

    for (const route of protectedRoutes) {
      await page.goto(route.path);

      await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll("/", "\\/")}(?:\\?|$)`), {
        timeout: 15_000,
      });
      await expect(page).not.toHaveURL(/\/onboarding\/organizacao/);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
      await expect(page.getByText(/erro ao carregar/i)).toHaveCount(0);
      await expect(page.getByText(/n[aã]o foi poss[ií]vel abrir esta [aá]rea/i)).toHaveCount(0);
    }
  });
});
