import { Page, expect, request } from "@playwright/test";

export async function resetDb(baseURL: string) {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post("/api/test/reset");
  if (!res.ok()) {
    throw new Error(`resetDb failed: ${res.status()} ${await res.text()}`);
  }
  await ctx.dispose();
}

export const SHARED = {
  volunteer: { password: "volunteer1234" },
  admin: { password: "admin1234" },
};

export async function login(
  page: Page,
  who: "admin" | "volunteer" = "volunteer",
) {
  await page.goto("/login");
  await page.getByLabel(/shelter password/i).fill(SHARED[who].password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
}
