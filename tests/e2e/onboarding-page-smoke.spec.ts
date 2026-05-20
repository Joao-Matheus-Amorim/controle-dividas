import { expect, test } from "@playwright/test";

test.describe("onboarding route smoke", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/onboarding/organizacao");

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});