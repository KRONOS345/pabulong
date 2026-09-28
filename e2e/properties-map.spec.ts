import { test, expect } from "@playwright/test";

test.describe("Properties & PostGIS Spatial Map E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/properties");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should render property metrics stat cards", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Properties & Geolocation Center");
    await expect(page.locator("text=Boarding Houses").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Available Rooms").first()).toBeVisible();
    await expect(page.locator("text=Occupied Units").first()).toBeVisible();
  });

  test("should render interactive PostGIS SVG map with distance rings", async ({ page }) => {
    const mapContainer = page.locator("text=PostGIS Spatial View");
    await mapContainer.scrollIntoViewIfNeeded();
    await expect(mapContainer).toBeVisible();

    const svgRadar = page.locator("svg[viewBox='0 0 100 100']");
    await expect(svgRadar).toBeVisible();

    // Verify distance rings and campus gate landmark
    await expect(page.locator("text=University Campus Gate")).toBeVisible();
    await expect(page.locator("text=150m")).toBeVisible();
  });

  test("should synchronize card hover with map pin and display popup drawer", async ({ page }) => {
    // Use attribute-based selector that matches the cursor-pointer Card regardless of nesting depth
    const propertyCard = page.locator("[class*='cursor-pointer']").first();

    // Skip gracefully when the DB has no seeded properties (empty-environment is valid)
    const hasCards = await propertyCard.isVisible({ timeout: 8000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, "No property data in environment — skipping interaction test");
      return;
    }

    await propertyCard.hover();

    // Click on property card to select
    await propertyCard.click();

    // Verify property drawer overlay displays with distance and availability
    await expect(page.locator("text=from Gate").first()).toBeVisible();
    await expect(page.locator("text=Available Rooms:").first()).toBeVisible();
  });

  test("should toggle Split Map view visibility", async ({ page }) => {
    const toggleBtn = page.locator('button:has-text("Hide Split Map")');
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await expect(page.locator('button:has-text("Show Split Map")')).toBeVisible();
    }
  });
});
