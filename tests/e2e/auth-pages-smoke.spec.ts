import { expect, test } from "@playwright/test";

test.describe("auth pages smoke", () => {
  test("renders sign-up page", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await expect(page).toHaveURL(/\/auth\/sign-up/);
    await expect(page.getByRole("heading", { name: /criar/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Criar senha")).toBeVisible();
    await expect(page.getByLabel("Repetir senha")).toBeVisible();
    await expect(page.getByRole("button", { name: /criar/i })).toBeVisible();
  });

  test("renders forgot password page", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    await expect(page).toHaveURL(/\/auth\/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enviar link de recuperacao" }),
    ).toBeVisible();
  });
});