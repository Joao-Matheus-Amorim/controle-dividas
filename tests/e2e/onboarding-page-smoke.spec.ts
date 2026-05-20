import { expect, test } from "@playwright/test";

test.describe("onboarding page smoke", () => {
  test("renders the initial organization onboarding page", async ({ page }) => {
    await page.goto("/onboarding/organizacao");

    await expect(page).toHaveURL(/\/onboarding\/organizacao/);
    await expect(page.getByText("Onboarding inicial")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Crie sua organizacao financeira/i })).toBeVisible();
    await expect(page.locator("#organization_name")).toBeVisible();
    await expect(page.locator("#organization_slug")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar para o app" })).toBeVisible();
  });
});
