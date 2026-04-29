import { expect, test } from "@playwright/test";

test.describe("Supabase auth activity", () => {
  test("logs in through the app login form", async ({ page, baseURL }) => {
    const email = process.env.E2E_AUTH_EMAIL;
    const password = process.env.E2E_AUTH_PASSWORD;

    expect(email, "Missing E2E_AUTH_EMAIL").toBeTruthy();
    expect(password, "Missing E2E_AUTH_PASSWORD").toBeTruthy();

    await page.goto(`${baseURL}/login?redirect=/mydesigns`, {
      waitUntil: "domcontentloaded"
    });

    await page.getByLabel("Email").fill(email as string);
    await page.getByLabel("Password").fill(password as string);

    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 60_000
      }),
      page.getByRole("button", { name: "Login" }).click()
    ]);

    await expect(page).toHaveURL(/\/mydesigns|\/design|\/account/, {
      timeout: 60_000
    });
  });
});
