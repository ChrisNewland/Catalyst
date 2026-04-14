import { test, expect } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.describe("dashboard", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });
  test("shows the seeded cats and each has a Log visit CTA", async ({
    page,
  }) => {
    await login(page);
    await expect(
      page.getByRole("heading", { name: /cats in care/i }),
    ).toBeVisible();
    for (const name of ["Mittens", "Shadow", "Biscuit"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    // At least one Log visit link is present (cats not yet visited today).
    await expect(
      page.getByRole("link", { name: /log visit/i }).first(),
    ).toBeVisible();
  });

  test("hides admin links from volunteers", async ({ page }) => {
    await login(page, "volunteer");
    await expect(page.getByRole("link", { name: /^cats$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^users$/i })).toHaveCount(0);
  });

  test("shows admin links to admins", async ({ page }) => {
    await login(page, "admin");
    await expect(page.getByRole("link", { name: /^cats$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^users$/i })).toBeVisible();
  });

  test("sign out returns to login", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
