import { test, expect } from "@playwright/test";
import { resetDb } from "./helpers";

test.describe("authentication", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /catalyst/i })).toBeVisible();
  });

  test("login with wrong password shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/shelter password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByTestId("login-error")).toContainText(/incorrect/i);
  });

  test("volunteer shared password logs in as volunteer role", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel(/shelter password/i).fill("volunteer1234");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /cats in care/i }),
    ).toBeVisible();
    await expect(page.getByTestId("role-badge")).toHaveText(/volunteer/i);
  });

  test("admin shared password logs in as admin role", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/shelter password/i).fill("admin1234");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("role-badge")).toHaveText(/admin/i);
  });
});
