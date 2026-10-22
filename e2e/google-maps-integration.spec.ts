import { test, expect } from "@playwright/test";

test.describe("Pabulong — Google Maps & Spatial Geolocation E2E Tests", () => {
  test("DISCOVERY FEED: renders map container and markers in Full Map and Split view", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for initial listing fetch to settle
    await expect(page.locator("text=Searching available spaces...")).not.toBeVisible({ timeout: 15000 });

    const mapBtn = page.getByRole("button", { name: "Full map view" });
    await expect(mapBtn).toBeVisible();
    await mapBtn.click();

    // Map container must be visible
    const mapContainer = page.locator("[data-testid='interactive-map-container']");
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Header badge indicates spatial coordinates in EPSG:4326 / Butuan
    await expect(page.locator("text=PostGIS Spatial View")).toBeVisible();
    await expect(page.locator("text=EPSG:4326")).toBeVisible();

    // Property markers with PHP rent badges exist
    const pins = page.locator("[role='button'][aria-label*='View']");
    await expect(pins.first()).toBeVisible({ timeout: 10000 });

    // Clicking a pin opens property drawer with View Listing link
    await pins.first().click();
    await expect(page.locator("text=from Gate").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View Listing" }).first()).toBeVisible();
  });

  test("PROPERTY DETAILS: displays Location & Neighborhood section with real coordinates", async ({
    page,
  }) => {
    // Navigate to Balangay Student Residences
    await page.goto("/properties/b0000000-0000-0000-0000-000000000001");
    await page.waitForLoadState("domcontentloaded");

    // Section title
    const heading = page.locator("#location-heading");
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText("Location & Neighborhood");

    // Address & Barangay
    await expect(page.locator("text=Barangay Dagohoy, Butuan City").first()).toBeVisible();

    // Campus proximity badge
    await expect(page.locator("text=to FSUU Main")).toBeVisible();

    // Directions CTA button linking to Google Maps with exact destination coordinates
    const directionsBtn = page.getByRole("link", { name: "Get Directions" });
    await expect(directionsBtn).toBeVisible();
    const href = await directionsBtn.getAttribute("href");
    expect(href).toContain("google.com/maps/dir");
    expect(href).toContain("destination=8.9482,125.5432");

    // Embedded map container
    const embeddedMap = page.locator("[data-testid='interactive-map-container']");
    await expect(embeddedMap).toBeVisible();

    // GPS coordinates display
    await expect(page.locator("text=GPS: 8.9482° N, 125.5432° E")).toBeVisible();
  });

  test("OWNER FORM: location picker allows adjusting coordinates with barangay snap helper", async ({
    page,
  }) => {
    // Enable dev mocks to access owner portal without real Clerk login
    await page.addInitScript(() => {
      window.localStorage.setItem("pabulong_dev_mock_role", "owner");
    });

    await page.goto("/owner/properties/new");
    await page.waitForLoadState("domcontentloaded");

    // Location picker header
    const pickerLabel = page.locator("text=Geographic Location (Map Coordinates)");
    await pickerLabel.scrollIntoViewIfNeeded();
    await expect(pickerLabel).toBeVisible({ timeout: 10000 });

    // Coordinate inputs
    const latInput = page.locator("#prop-lat");
    const lngInput = page.locator("#prop-lng");
    await expect(latInput).toBeVisible();
    await expect(lngInput).toBeVisible();

    // Snap to Barangay Center helper button
    const snapBtn = page.getByRole("button", { name: /Snap to .* Center/ });
    await expect(snapBtn).toBeVisible();
    await snapBtn.click();

    // Input values are populated with valid numbers
    const latVal = await latInput.inputValue();
    const lngVal = await lngInput.inputValue();
    expect(parseFloat(latVal)).toBeGreaterThan(8.5);
    expect(parseFloat(lngVal)).toBeGreaterThan(125.0);

    // Campus proximity indicator
    await expect(page.locator("text=Pin is approximately")).toBeVisible();
  });
});
