import { test, expect } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.describe("admin", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });

  test("volunteer is bounced off /admin/cats", async ({ page }) => {
    await login(page, "volunteer");
    await page.goto("/admin/cats");
    await expect(page).toHaveURL("/");
  });

  test("admin can add a new cat", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/admin/cats");
    await expect(
      page.getByRole("heading", { name: /manage cats/i }),
    ).toBeVisible();

    await page.getByLabel(/^name$/i).fill("Pepper");
    await page.getByLabel(/notes/i).fill("Tortie, new intake.");
    await page.getByRole("button", { name: /^add cat$/i }).click();

    await expect(page.getByRole("row", { name: /pepper/i })).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("Pepper", { exact: true })).toBeVisible();
  });

  test("admin can archive a cat so it disappears from dashboard", async ({
    page,
  }) => {
    await login(page, "admin");
    await page.goto("/admin/cats");
    await page
      .getByRole("row", { name: /shadow/i })
      .getByRole("button", { name: /archive/i })
      .click();
    await page.goto("/");
    await expect(page.getByText("Shadow", { exact: true })).toHaveCount(0);
  });
});
