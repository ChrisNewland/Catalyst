import { test, expect } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.describe("log entry form", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });
  test("volunteer can log a minimal visit (urinated only) and return to dashboard", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: /log visit/i }).first().click();

    await expect(
      page.getByRole("heading", { name: /log visit/i }),
    ).toBeVisible();

    // Food: SOME
    await page.getByRole("button", { name: /^some$/i, exact: false }).first().click();
    // Water: NORMAL
    await page.getByTestId("water-NORMAL").click();
    // Urinated toggle on
    await page.getByTestId("toggle-urinated").click();
    // defecated stays off; Bristol picker must not be visible
    await expect(page.getByTestId("bristol-picker")).toHaveCount(0);
    // Submit
    await page.getByRole("button", { name: /^save visit$/i }).click();

    await expect(page).toHaveURL(/\/\?logged=/);
    await expect(page.getByTestId("toast")).toContainText(/logged/i);
  });

  test("Bristol picker appears only when defecated is on and is required", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: /log visit/i }).first().click();

    await expect(page.getByTestId("bristol-picker")).toHaveCount(0);
    await page.getByTestId("toggle-defecated").click();
    await expect(page.getByTestId("bristol-picker")).toBeVisible();

    // Try to submit without picking a score -> inline error.
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page.getByTestId("form-error")).toContainText(/bristol/i);

    // Pick 4 and submit.
    await page.getByTestId("bristol-4").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page).toHaveURL(/\/\?logged=/);
  });

  test("after logging a cat moves from 'Needs visit today' to 'Visited today'", async ({
    page,
  }) => {
    await login(page);
    // Pick the first cat explicitly by grabbing its name.
    const catLink = page.getByRole("link", { name: /log visit/i }).first();
    const cardText = await catLink.locator("..").innerText();
    const catName = cardText.split("\n")[0].trim();
    await catLink.click();

    await page.getByTestId("food-ALL").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page).toHaveURL(/\/\?logged=/);

    // Heading should now exist
    await expect(
      page.getByRole("heading", { name: /visited today/i }),
    ).toBeVisible();
    // The cat is under "Visited today" with a "Log again" CTA.
    await expect(page.getByText(catName, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /log again/i }),
    ).toBeVisible();
  });
});
