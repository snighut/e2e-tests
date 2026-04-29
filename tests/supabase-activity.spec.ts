import { expect, test } from "@playwright/test";
import { loginThroughApp } from "./helpers/auth";

test.describe("Supabase auth activity", () => {
  test("logs in through the app login form", async ({ page, baseURL }) => {
    await loginThroughApp(page, baseURL as string);
  });

  test("receives AI response to hello within 5 seconds", async ({ page, baseURL }) => {
    await loginThroughApp(page, baseURL as string);

    await page.getByTitle("Open AI Assistant").click();

    const input = page.getByPlaceholder("Ask a question or describe a system design...");
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill("hello");
    await page.getByRole("button", { name: "Chat", exact: true }).click();

    const messageBodies = page.locator("p.text-sm.whitespace-pre-wrap.break-words");
    await expect
      .poll(async () => messageBodies.count(), {
        timeout: 5_000,
        message: "Expected assistant response message within 5 seconds"
      })
      .toBeGreaterThan(1);

    const lastMessage = (await messageBodies.last().innerText()).trim();
    expect(lastMessage.length, "Assistant response should not be empty").toBeGreaterThan(0);
    expect(lastMessage, "Assistant returned an error message").not.toBe(
      "Sorry, I encountered an error while processing your request."
    );
  });
});
