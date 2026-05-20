import { expect, test } from "@playwright/test";

test.describe("protected route redirect smoke", () => {
  test("redirects unauthenticated users from protected app to login", async ({ page }) => {
    await page.goto("/protected");

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});
