import { test, expect } from "@playwright/test";

test.describe("Second Brain & AI Vector Search E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/notes");
  });

  test("should display Second Brain page header and notes list", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Second Brain Knowledge Base");
    const noteCards = page.locator(".grid > .border-slate-800\\/80");
    await expect(noteCards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should filter notes when clicking a tag pill", async ({ page }) => {
    const tagButton = page.locator("button:has-text('#policy')").first();
    if (await tagButton.isVisible()) {
      await tagButton.click();
      await expect(tagButton).toHaveClass(/bg-indigo-600/);
    }
  });

  test("should perform AI Vector Semantic Search and render similarity badges", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Semantic vector query"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill("affordable dorm with wifi");

    // Verify AI Vector mode or search results display match badges
    const matchBadge = page.locator("text=% Match").first();
    await expect(matchBadge).toBeVisible({ timeout: 10000 });
  });

  test("should open Capture Knowledge dialog and fill note details", async ({ page }) => {
    const captureButton = page.locator('button:has-text("Capture Knowledge")');
    await captureButton.click();

    const dialogTitle = page.locator('div[role="dialog"]');
    await expect(dialogTitle).toBeVisible();

    await page.fill('input[placeholder*="Standard Tenancy Agreement"]', "E2E Test Inspection Protocol");
    await page.fill('textarea[placeholder*="Enter detailed observation"]', "Automated test note verifying persistent memory storage.");
    await page.fill('input[placeholder*="dorms, policy, pricing"]', "e2e, testing, automated");

    const submitBtn = page.locator('button:has-text("Save Note")');
    await expect(submitBtn).toBeEnabled();
  });
});
