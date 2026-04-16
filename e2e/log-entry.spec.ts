import { test, expect } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.describe("log entry form", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });

  test("Logged by is required — saving without a name shows an inline error", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: /log visit/i }).first().click();

    await page.getByTestId("food-SOME").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();

    await expect(page.getByTestId("form-error")).toContainText(/name/i);
    // Still on the log form — no redirect.
    await expect(page).toHaveURL(/\/cats\/.+\/log\/new/);
  });

  test("volunteer can log a minimal visit (urinated only) and return to dashboard", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: /log visit/i }).first().click();

    await expect(
      page.getByRole("heading", { name: /log visit/i }),
    ).toBeVisible();

    await page.getByTestId("logged-by-name").fill("Sarah");
    await page.getByTestId("food-SOME").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByTestId("toggle-urinated").click();
    await expect(page.getByTestId("bristol-picker")).toHaveCount(0);
    await page.getByRole("button", { name: /^save visit$/i }).click();

    await expect(page).toHaveURL(/\/\?logged=/);
    await expect(page.getByTestId("toast")).toContainText(/logged/i);
  });

  test("Bristol picker appears only when defecated is on and is required", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: /log visit/i }).first().click();

    await page.getByTestId("logged-by-name").fill("Sarah");
    await expect(page.getByTestId("bristol-picker")).toHaveCount(0);
    await page.getByTestId("toggle-defecated").click();
    await expect(page.getByTestId("bristol-picker")).toBeVisible();

    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page.getByTestId("form-error")).toContainText(/bristol/i);

    await page.getByTestId("bristol-4").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page).toHaveURL(/\/\?logged=/);
  });

  test("Logged-by name is remembered for the next visit (localStorage)", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: /log visit/i }).first().click();

    await page.getByTestId("logged-by-name").fill("Priya");
    await page.getByTestId("food-ALL").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page).toHaveURL(/\/\?logged=/);

    // Open another cat's log form and confirm the name is pre-filled.
    await page.getByRole("link", { name: /log visit/i }).first().click();
    await expect(page.getByTestId("logged-by-name")).toHaveValue("Priya");
  });

  test("after logging a cat moves from 'Needs visit today' to 'Visited today'", async ({
    page,
  }) => {
    await login(page);
    const catLink = page.getByRole("link", { name: /log visit/i }).first();
    const cardText = await catLink.locator("..").innerText();
    const catName = cardText.split("\n")[0].trim();
    await catLink.click();

    await page.getByTestId("logged-by-name").fill("Jo");
    await page.getByTestId("food-ALL").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page).toHaveURL(/\/\?logged=/);

    await expect(
      page.getByRole("heading", { name: /visited today/i }),
    ).toBeVisible();
    await expect(page.getByText(catName, { exact: true })).toBeVisible();
    await expect(page.getByText(/last seen .* by jo/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /log again/i }),
    ).toBeVisible();
  });
});
