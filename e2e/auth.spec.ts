import { test, expect } from "@playwright/test";
import { resetDb } from "./helpers";

test.describe("authentication", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("login with bad credentials shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@shelter.test");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByTestId("login-error")).toContainText(/invalid/i);
  });

  test("volunteer can log in and land on dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("vol@shelter.test");
    await page.getByLabel(/password/i).fill("volunteer1234");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /cats in care/i })).toBeVisible();
    await expect(page.getByText(/val volunteer/i)).toBeVisible();
  });
});
