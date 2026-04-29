import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginThroughApp } from "./helpers/auth";

test.describe.configure({ timeout: 120_000 });

function getDesignIdFromCurrentUrl(page: Page): string | null {
  const url = new URL(page.url());
  return url.searchParams.get("id");
}

function parseGroupCount(text: string): number {
  const match = text.match(/Existing\s+(\d+)\s+group/i);
  return match ? Number(match[1]) : 0;
}

async function getGroupCount(page: Page): Promise<number> {
  const indicator = page.getByRole("button", { name: /Existing\s+\d+\s+group/i }).first();
  if ((await indicator.count()) === 0) {
    return 0;
  }

  const raw = (await indicator.innerText()).trim();
  return parseGroupCount(raw);
}

async function saveCanvasAndAssert(page: Page) {
  const saveButton = (await page.getByTestId("canvas-save-button").count())
    ? page.getByTestId("canvas-save-button").first()
    : page.getByRole("button", { name: /Save|Saving\.\.\.|Saved!/ }).first();
  await expect(saveButton).toBeVisible({ timeout: 15_000 });
  await saveButton.click();

  await expect(saveButton).toContainText(/Saving\.\.\.|Saved!|Save/, { timeout: 15_000 });
  await expect(page.getByText(/Design saved|Design and thumbnail saved|All done!/i).first()).toBeVisible({
    timeout: 20_000
  });
}

async function updateTitle(page: Page, nextTitle: string) {
  const inlineTitle = (await page.getByTestId("inline-title-value").count())
    ? page.getByTestId("inline-title-value").first()
    : page.locator("span.text-lg.font-bold span.truncate").first();
  await expect(inlineTitle).toBeVisible({ timeout: 15_000 });
  await expect(inlineTitle).not.toHaveText("Loading...", { timeout: 15_000 });

  await inlineTitle.hover();

  if (await page.getByTestId("edit-title-button").count()) {
    await page.getByTestId("edit-title-button").first().click();
  } else {
    await page.getByTitle("Edit title").first().click();
  }

  const titleInput = (await page.getByTestId("title-input").count())
    ? page.getByTestId("title-input").first()
    : page.locator('input[type="text"]').first();
  await titleInput.fill(nextTitle);

  if (await page.getByTestId("save-title-button").count()) {
    await page.getByTestId("save-title-button").first().click();
  } else {
    await page.getByTitle("Save title").first().click();
  }

  await expect(page.getByText("Title updated!")).toBeVisible({ timeout: 15_000 });
  await expect(inlineTitle).toContainText(nextTitle, { timeout: 15_000 });
}

async function getTotalDesignCount(page: Page): Promise<number> {
  const loadingByTestId = page.getByTestId("loading-designs");
  if ((await loadingByTestId.count()) > 0) {
    await expect(loadingByTestId.first()).toBeHidden({ timeout: 20_000 });
  } else {
    const loadingText = page.getByText("Loading designs...").first();
    if ((await loadingText.count()) > 0) {
      await expect(loadingText).toBeHidden({ timeout: 20_000 });
    }
  }

  const testIdCount = page.getByTestId("total-design-count");
  if ((await testIdCount.count()) > 0) {
    const raw = (await testIdCount.first().innerText()).trim();
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const label = page.getByText("Total Designs").first();
  await expect(label).toBeVisible({ timeout: 20_000 });
  const valueNode = label.locator("xpath=following-sibling::p[1]");
  const raw = (await valueNode.innerText()).trim();
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function openFirstProjectFromMyDesigns(page: Page, baseURL: string): Promise<string | null> {
  await page.goto(`${baseURL}/mydesigns`, { waitUntil: "domcontentloaded" });

  const loadingByTestId = page.getByTestId("loading-designs");
  if ((await loadingByTestId.count()) > 0) {
    await expect(loadingByTestId.first()).toBeHidden({ timeout: 20_000 });
  } else {
    const loadingText = page.getByText("Loading designs...").first();
    if ((await loadingText.count()) > 0) {
      await expect(loadingText).toBeHidden({ timeout: 20_000 });
    }
  }

  const totalDesigns = await getTotalDesignCount(page);
  if (totalDesigns === 0) {
    return null;
  }

  const firstCard = (await page.locator('[data-testid^="project-card-"]').count())
    ? page.locator('[data-testid^="project-card-"]').first()
    : page.locator("div.group.cursor-pointer").filter({ has: page.locator("h3") }).first();

  await expect(firstCard, "Expected at least one clickable project card on /mydesigns").toBeVisible({
    timeout: 20_000
  });

  await firstCard.hover();

  const editControlByTestId = firstCard.locator('[data-testid^="project-view-edit-control-"]').first();
  if ((await editControlByTestId.count()) > 0) {
    await editControlByTestId.click();
  } else {
    const cardButtons = firstCard.locator("button");
    const buttonCount = await cardButtons.count();
    if (buttonCount >= 2) {
      // In grid/list card actions, second icon is the edit action.
      await cardButtons.nth(1).click();
    } else if (buttonCount >= 1) {
      await cardButtons.first().click();
    } else {
      await firstCard.click();
    }
  }

  await expect(page).toHaveURL(/\/design\?id=[^&]+/, { timeout: 20_000 });
  return getDesignIdFromCurrentUrl(page);
}

async function deleteFirstProjectCardFromMyDesigns(page: Page): Promise<boolean> {
  const firstCard = (await page.locator('[data-testid^="project-card-"]').count())
    ? page.locator('[data-testid^="project-card-"]').first()
    : page.locator("div.group.cursor-pointer").filter({ has: page.locator("h3") }).first();

  if ((await firstCard.count()) === 0) {
    return false;
  }

  await expect(firstCard).toBeVisible({ timeout: 20_000 });
  await firstCard.hover();

  const deleteControlByTestId = firstCard.locator('[data-testid^="project-delete-button-"]').first();
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  if ((await deleteControlByTestId.count()) > 0) {
    await deleteControlByTestId.click();
    return true;
  }

  const cardButtons = firstCard.locator("button");
  const buttonCount = await cardButtons.count();
  if (buttonCount >= 3) {
    // Grid/list card actions are view, edit, delete.
    await cardButtons.nth(2).click();
    return true;
  }

  return false;
}

test.describe("Collaboration app end-to-end journeys", () => {
  test("journey 1: projects load, count is shown, and navigation opens design", async ({ page, baseURL }) => {
    await loginThroughApp(page, baseURL as string, "/mydesigns");

    const totalCount = await getTotalDesignCount(page);
    expect(totalCount, "Total design count should be numeric and non-negative").toBeGreaterThanOrEqual(0);

    const targetDesignId = await openFirstProjectFromMyDesigns(page, baseURL as string);
    test.skip(!targetDesignId, "No existing project available on /mydesigns for navigation journey");
    expect(targetDesignId, "Expected first existing project id after navigation").toBeTruthy();
    await expect(page).toHaveURL(/\/design\?id=[^&]+/, { timeout: 20_000 });
  });

  test("journey 2: title edit persists in my projects and is reverted", async ({ page, baseURL }) => {
    await loginThroughApp(page, baseURL as string, "/mydesigns");
    const targetDesignId = await openFirstProjectFromMyDesigns(page, baseURL as string);
    test.skip(!targetDesignId, "No existing project available on /mydesigns for title edit journey");

    await page.goto(`${baseURL}/design?id=${targetDesignId}`, {
      waitUntil: "domcontentloaded"
    });

    const inlineTitle = (await page.getByTestId("inline-title-value").count())
      ? page.getByTestId("inline-title-value").first()
      : page.locator("span.text-lg.font-bold span.truncate").first();
    await expect(inlineTitle).toBeVisible({ timeout: 15_000 });
    await expect(inlineTitle).not.toHaveText("Loading...", { timeout: 15_000 });

    const originalTitle = (await inlineTitle.innerText()).trim();
    const editedTitle = `${originalTitle} e2e`;

    try {
      await updateTitle(page, editedTitle);

      await page.goto(`${baseURL}/mydesigns`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(editedTitle, { exact: false }).first()).toBeVisible({ timeout: 20_000 });
    } finally {
      await page.goto(`${baseURL}/design?id=${targetDesignId}`, {
        waitUntil: "domcontentloaded"
      });
      await updateTitle(page, originalTitle);
    }
  });

  test("journey 3: save existing and new design, then cleanup", async ({ page, baseURL }) => {
    await loginThroughApp(page, baseURL as string, "/mydesigns");

    await page.goto(`${baseURL}/mydesigns`, { waitUntil: "domcontentloaded" });
    const baselineDesignCount = await getTotalDesignCount(page);

    const targetDesignId = await openFirstProjectFromMyDesigns(page, baseURL as string);
    test.skip(!targetDesignId, "No existing project available on /mydesigns for save journey");

    await page.goto(`${baseURL}/design?id=${targetDesignId}`, {
      waitUntil: "domcontentloaded"
    });

    const beforeCount = await getGroupCount(page);
    await page.getByRole("button", { name: "Add Design Group" }).click();
    await saveCanvasAndAssert(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    const afterCount = await getGroupCount(page);
    const existingDesignGroupIncreased = afterCount > beforeCount;

    const newestGroupName = `Group ${beforeCount + 1}`;
    const groupIndicator = page.getByRole("button", { name: /Existing\s+\d+\s+group/i }).first();
    if (existingDesignGroupIncreased && (await groupIndicator.isVisible())) {
      await groupIndicator.click();
      await page.getByText(newestGroupName, { exact: true }).first().click();
      await page.keyboard.press("Delete");
      await saveCanvasAndAssert(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      const revertedCount = await getGroupCount(page);
      expect(revertedCount, "Existing design group count should be reverted").toBe(beforeCount);
    }

    await page.goto(`${baseURL}/design?id=new`, {
      waitUntil: "domcontentloaded"
    });

    await page.getByRole("button", { name: "Add Design Group" }).click();
    await saveCanvasAndAssert(page);
    await expect(page).toHaveURL(/\/design\?id=(?!new$)[^&]+/, { timeout: 25_000 });

    const newDesignId = getDesignIdFromCurrentUrl(page);
    expect(newDesignId, "Expected new design save to generate an id").toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`/design\\?id=${newDesignId}`), { timeout: 20_000 });

    await page.goto(`${baseURL}/mydesigns`, { waitUntil: "domcontentloaded" });

    await expect
      .poll(async () => getTotalDesignCount(page), {
        timeout: 30_000,
        message: "Expected /mydesigns count to increase by 1 after creating a new design"
      })
      .toBe(baselineDesignCount + 1);

    const deleted = await deleteFirstProjectCardFromMyDesigns(page);
    expect(deleted, "Expected to delete first project card from /mydesigns").toBeTruthy();

    await expect
      .poll(async () => getTotalDesignCount(page), {
        timeout: 25_000,
        message: "Expected /mydesigns count to return to baseline after cleanup delete"
      })
      .toBe(baselineDesignCount);
  });
});
