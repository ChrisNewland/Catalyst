import { test } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.describe("screenshots @visual", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });

  test("capture key screens", async ({ page }) => {
    // 1. Login page
    await page.goto("/login");
    await page.screenshot({ path: "test-results/01-login.png", fullPage: true });

    // 2. Login error state
    await page.getByLabel(/email/i).fill("admin@shelter.test");
    await page.getByLabel(/password/i).fill("wrong");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForSelector("[data-testid='login-error']");
    await page.screenshot({ path: "test-results/02-login-error.png", fullPage: true });

    // 3. Volunteer dashboard (3 cats, none visited)
    await login(page, "volunteer");
    await page.screenshot({ path: "test-results/03-dashboard-empty.png", fullPage: true });

    // 4. Log form — default state
    await page.getByRole("link", { name: /log visit/i }).first().click();
    await page.screenshot({ path: "test-results/04-log-form-empty.png", fullPage: true });

    // 5. Log form filled in with defecated+bristol
    await page.getByTestId("food-SOME").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByTestId("toggle-urinated").click();
    await page.getByTestId("toggle-defecated").click();
    await page.getByTestId("bristol-4").click();
    await page.getByTestId("condition-CONCERN").click();
    await page.screenshot({ path: "test-results/05-log-form-filled.png", fullPage: true });

    // 6. Dashboard after log — with toast + "Visited today"
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await page.waitForURL(/\/\?logged=/);
    await page.screenshot({ path: "test-results/06-dashboard-after-log.png", fullPage: true });

    // 7. Cat profile
    const link = page.getByRole("link", { name: /log again/i }).first();
    const href = await link.getAttribute("href");
    const catId = href!.split("/")[2];
    await page.goto(`/cats/${catId}`);
    await page.screenshot({ path: "test-results/07-cat-profile.png", fullPage: true });

    // 8. Admin dashboard
    await page.context().clearCookies();
    await login(page, "admin");
    await page.screenshot({ path: "test-results/08-admin-dashboard.png", fullPage: true });

    // 9. Admin cats page
    await page.goto("/admin/cats");
    await page.screenshot({ path: "test-results/09-admin-cats.png", fullPage: true });

    // 10. Admin users page
    await page.goto("/admin/users");
    await page.screenshot({ path: "test-results/10-admin-users.png", fullPage: true });
  });
});
