import { test, expect } from "@playwright/test";
import { login, resetDb } from "./helpers";

test.describe("cat profile", () => {
  test.beforeEach(async ({ baseURL }) => {
    await resetDb(baseURL!);
  });

  test("shows 'no entries yet' when the cat has no log entries", async ({
    page,
  }) => {
    await login(page);
    // Navigate via "cats in care" — since all cats have no entries, they're under "Needs visit today".
    // To get to the profile, click the cat's name link via the dashboard "visited today" flow
    // won't apply. Go directly to /cats/[id] by grabbing the URL from a log-visit link.
    const firstLink = page.getByRole("link", { name: /log visit/i }).first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    const catId = href!.split("/")[2];
    await page.goto(`/cats/${catId}`);
    await expect(
      page.getByRole("heading", { name: /last 7 days/i }),
    ).toBeVisible();
    await expect(page.getByTestId("no-entries")).toContainText(/no log entries/i);
  });

  test("shows a logged entry on the cat profile", async ({ page }) => {
    await login(page);
    const firstLink = page.getByRole("link", { name: /log visit/i }).first();
    const href = await firstLink.getAttribute("href");
    const catId = href!.split("/")[2];

    await page.goto(`/cats/${catId}/log/new`);
    await page.getByTestId("food-ALL").click();
    await page.getByTestId("water-NORMAL").click();
    await page.getByTestId("toggle-defecated").click();
    await page.getByTestId("bristol-5").click();
    await page.getByRole("button", { name: /^save visit$/i }).click();
    await expect(page).toHaveURL(/\/\?logged=/);

    await page.goto(`/cats/${catId}`);
    const entry = page.getByTestId("log-entry").first();
    await expect(entry).toContainText(/val volunteer/i);
    await expect(entry).toContainText(/food: all/i);
    await expect(entry).toContainText(/water: normal/i);
    await expect(entry).toContainText(/bristol 5/i);
  });
});
