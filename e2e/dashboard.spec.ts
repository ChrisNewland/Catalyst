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
    await expect(
      page.getByRole("link", { name: /log visit/i }).first(),
    ).toBeVisible();
  });

  test("hides the admin Cats link from volunteers", async ({ page }) => {
    await login(page, "volunteer");
    await expect(page.getByRole("link", { name: /^cats$/i })).toHaveCount(0);
  });

  test("shows the admin Cats link to admins", async ({ page }) => {
    await login(page, "admin");
    await expect(page.getByRole("link", { name: /^cats$/i })).toBeVisible();
  });

  test("sign out returns to login", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
