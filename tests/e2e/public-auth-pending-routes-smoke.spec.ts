import { expect, test } from "@playwright/test";

test.describe("pending public and auth routes smoke", () => {
  test("renders public entry page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("FamilyFinance", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acesso familiar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta" })).toBeVisible();
  });

  test("renders update password page without submitting", async ({ page }) => {
    await page.goto("/auth/update-password");

    await expect(page).toHaveURL(/\/auth\/update-password/);
    await expect(page.getByRole("heading", { name: "Atualizar senha" })).toBeVisible();
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Repetir nova senha")).toBeVisible();
    await expect(page.getByRole("button", { name: /salvar nova senha/i })).toBeVisible();
  });

  test("renders auth error page with provided error", async ({ page }) => {
    await page.goto("/auth/error?error=smoke-test-error");

    await expect(page).toHaveURL(/\/auth\/error/);
    await expect(
      page.getByRole("heading", { name: "Sorry, something went wrong." }),
    ).toBeVisible();
    await expect(page.getByText("Code error: smoke-test-error")).toBeVisible();
  });

  test("redirects auth confirm without callback params to auth error", async ({ page }) => {
    await page.goto("/auth/confirm");

    await expect(page).toHaveURL(/\/auth\/error\?error=No%20token%20hash%20or%20type/);
    await expect(
      page.getByRole("heading", { name: "Sorry, something went wrong." }),
    ).toBeVisible();
    await expect(page.getByText("Code error: No token hash or type").first()).toBeVisible();
  });
});
