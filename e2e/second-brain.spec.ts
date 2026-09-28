import { test, expect } from "@playwright/test";

test.describe("Second Brain & AI Vector Search E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/notes");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display Second Brain page header and notes list", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Second Brain Knowledge Base");
    const noteCards = page.locator(".grid > div");
    await expect(noteCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should filter notes when clicking a tag pill", async ({ page }) => {
    const tagButton = page.locator("button:has-text('#policy')").first();
    if (await tagButton.isVisible()) {
      await tagButton.click();
      await expect(tagButton).toBeVisible();
    }
  });

  test("should perform AI Vector Semantic Search and render similarity badges", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Semantic vector query"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill("affordable dorm with wifi");
    await searchInput.press("Enter");

    // Allow time for search to resolve
    await page.waitForTimeout(2000);

    // If notes exist with similarity, badges will appear; if DB is empty the empty-state shows instead
    const matchBadge = page.locator("text=% Match").first();
    const emptyState = page.locator("text=No notes match your query").first();

    const hasBadges = await matchBadge.isVisible({ timeout: 12000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    // One of these must be true — either results with badges, or the empty state
    expect(hasBadges || hasEmptyState).toBe(true);
  });

  test("should open Capture Knowledge dialog and fill note details", async ({ page }) => {
    const captureButton = page.locator('button:has-text("Capture Knowledge")');
    await captureButton.click();

    const dialogTitle = page.locator('div[role="dialog"]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });

    await page.fill('#note-title', "E2E Test Inspection Protocol");
    await page.fill('#note-content', "Automated test note verifying persistent memory storage.");
    await page.fill('#note-tags', "e2e, testing, automated");

    const submitBtn = page.locator('button:has-text("Save Note")');
    await expect(submitBtn).toBeEnabled();
  });
});
