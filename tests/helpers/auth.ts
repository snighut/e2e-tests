import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function loginThroughApp(
  page: Page,
  baseURL: string,
  redirectPath = "/mydesigns"
) {
  const email = process.env.E2E_AUTH_EMAIL;
  const password = process.env.E2E_AUTH_PASSWORD;

  expect(email, "Missing E2E_AUTH_EMAIL").toBeTruthy();
  expect(password, "Missing E2E_AUTH_PASSWORD").toBeTruthy();

  await page.goto(`${baseURL}/login?redirect=${encodeURIComponent(redirectPath)}`, {
    waitUntil: "domcontentloaded"
  });

  await page.getByLabel("Email").fill(email as string);
  await page.getByLabel("Password").fill(password as string);

  await Promise.all([
    page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), {
      timeout: 60_000
    }),
    page.getByRole("button", { name: "Login" }).click()
  ]);

  await expect(page).toHaveURL(/\/mydesigns|\/design|\/account/, {
    timeout: 60_000
  });
}
