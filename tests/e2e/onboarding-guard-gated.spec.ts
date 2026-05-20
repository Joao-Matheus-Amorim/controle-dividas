import { expect, test } from "@playwright/test";

type Env = Partial<Record<string, string | undefined>>;

const requiredVariables = [
  "E2E_CASE_EMAIL",
  "E2E_CASE_PASSWORD",
  "E2E_CASE_SLUG",
] as const;

function getCaseConfig(env: Env = process.env) {
  const enabled = env.RUN_ONBOARDING_CASE_E2E === "true";
  const missingVariables = enabled
    ? requiredVariables.filter((key) => !env[key])
    : [];

  return {
    enabled,
    missingVariables,
    email: env.E2E_CASE_EMAIL,
    password: env.E2E_CASE_PASSWORD,
    slug: env.E2E_CASE_SLUG,
  };
}

const caseConfig = getCaseConfig();
const runCaseE2e = caseConfig.enabled && caseConfig.missingVariables.length === 0;
const caseTest = runCaseE2e ? test : test.skip;

test.describe("authenticated onboarding guard E2E contract", () => {
  test.describe.configure({ mode: "serial" });

  test("fails when enabled onboarding guard E2E variables are incomplete", () => {
    if (!caseConfig.enabled) {
      expect(runCaseE2e).toBe(false);
      expect(caseConfig.missingVariables).toEqual([]);
      return;
    }

    expect(caseConfig.missingVariables).toEqual([]);
    expect(runCaseE2e).toBe(true);
  });

  caseTest("shows a friendly message when the organization slug is already unavailable", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(caseConfig.email!);
    await page.getByLabel("Senha").fill(caseConfig.password!);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.locator("#organization_name")).toBeVisible();
    await expect(page.locator("#organization_slug")).toBeVisible();

    await page.locator("#organization_name").fill("E2E Onboarding Guard Organization");
    await page.locator("#organization_slug").fill(caseConfig.slug!);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Este slug já está em uso.")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.getByRole("heading", { name: "Crie sua organizacao financeira" })).toBeVisible();
  });
});
