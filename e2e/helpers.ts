import { Page, expect, request } from "@playwright/test";

export async function resetDb(baseURL: string) {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post("/api/test/reset");
  if (!res.ok()) {
    throw new Error(`resetDb failed: ${res.status()} ${await res.text()}`);
  }
  await ctx.dispose();
}

export const SEED = {
  admin: { email: "admin@shelter.test", password: "admin1234", name: "Alex Admin" },
  volunteer: { email: "vol@shelter.test", password: "volunteer1234", name: "Val Volunteer" },
};

export async function login(
  page: Page,
  who: "admin" | "volunteer" = "volunteer",
) {
  const creds = SEED[who];
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/password/i).fill(creds.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
}
