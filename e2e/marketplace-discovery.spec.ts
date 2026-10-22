import { test, expect } from "@playwright/test";

test.describe("Pabulong Phase 3 — Marketplace Discovery & Listing Flow", () => {
  test("renders real Butuan boarding house listings on discovery homepage", async ({ page }) => {
    await page.goto("/");

    // 1. Check Brand & Header Identity
    await expect(page.getByText("Pabulong", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Butuan City, Agusan del Norte")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Find Boarding Houses & Rentals in Butuan" })
    ).toBeVisible();

    // 2. Real Seeded Listings Rendered
    // Balangay Residences (FSUU Downtown)
    const balangayHeading = page.getByRole("heading", {
      name: "Balangay Student Residences - FSUU Campus",
    });
    await expect(balangayHeading).toBeVisible();

    // Green Valley Dormitory (CSU Ampayon)
    const greenValleyHeading = page.getByRole("heading", {
      name: "Green Valley Dormitory - CSU Ampayon",
    });
    await expect(greenValleyHeading).toBeVisible();

    // Pinecrest Suites (Libertad)
    const pinecrestHeading = page.getByRole("heading", {
      name: "Pinecrest Suites Libertad",
    });
    await expect(pinecrestHeading).toBeVisible();

    // 3. Check Price Tags in Philippine Peso (₱)
    const priceText = page.getByText("₱2,200").first();
    await expect(priceText).toBeVisible();
  });

  test("filters listings by search query and restores on reset", async ({ page }) => {
    await page.goto("/");

    // Search for "Ampayon"
    const searchInput = page.getByLabel("Search boarding houses");
    await searchInput.fill("Ampayon");

    // Wait for debounced search update
    await expect(
      page.getByRole("heading", { name: "Green Valley Dormitory - CSU Ampayon" })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).not.toBeVisible();

    // Clear search using clear button or reset
    const clearButton = page.getByLabel("Clear search");
    await clearButton.click();
    await expect(searchInput).toHaveValue("");

    // All listings restored
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("navigates to listing detail page and displays authentic rooms and landlord data", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on Balangay Residences card link
    const listingLink = page.getByRole("link", { name: "Balangay Student Residences - FSUU Campus" }).first();
    await expect(listingLink).toBeVisible();
    await listingLink.click();

    // Verify detail page URL
    await page.waitForURL(/\/properties\/.+/);
    await expect(page).toHaveURL(/\/properties\/.+/);

    // Verify Property Detail Header
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible();
    await expect(page.getByText("Barangay Dagohoy, Butuan City")).toBeVisible();
    await expect(page.getByText("Verified Boarding House")).toBeVisible();

    // Verify Rooms & Rates Section with Philippine Pesos
    await expect(
      page.getByRole("heading", { name: "Rooms & Rental Rates" })
    ).toBeVisible();
    await expect(page.getByText("Room Unit 201", { exact: true })).toBeVisible();
    await expect(page.getByText("₱3,500").first()).toBeVisible();

    // Verify Amenities Section
    await expect(
      page.getByRole("heading", { name: "Amenities & Facilities" })
    ).toBeVisible();
    await expect(page.getByText("Fiber Wi-Fi (200Mbps)")).toBeVisible();
    await expect(page.getByText("Backup Generator (5kVA)")).toBeVisible();

    // Verify House Policies
    await expect(page.getByText("Curfew Policy")).toBeVisible();

    // Verify Landlord / Caretaker card
    await expect(page.getByText("Landlord Information")).toBeVisible();
    await expect(page.getByText("Operating in Barangay Dagohoy")).toBeVisible();

    // Verify Inquiry CTA exists
    const inquiryButton = page.getByRole("button", { name: "Send Inquiry to Landlord" });
    await expect(inquiryButton).toBeVisible();
  });

  test("toggles discovery view modes between Grid, Split Map, and Full Map", async ({ page }) => {
    await page.goto("/");

    // 1. Initially in Grid view
    const isMobile = page.viewportSize() ? page.viewportSize()!.width < 768 : false;
    const gridBtn = page.getByRole("button", { name: "Grid view" });
    const splitBtn = page.getByRole("button", { name: "Split view with map" });
    const mapBtn = page.getByRole("button", { name: "Full map view" });

    await expect(gridBtn).toBeVisible();
    if (!isMobile) {
      await expect(splitBtn).toBeVisible();
    }
    await expect(mapBtn).toBeVisible();

    // 2. Switch to Full Map view
    await mapBtn.click();
    await expect(page.locator("text=PostGIS Spatial View")).toBeVisible();
    await expect(page.locator("text=University Campus Gate")).toBeVisible();

    // Verify distance rings exist
    await expect(page.locator("text=150m")).toBeVisible();

    // Verify map pins with PHP peso tags exist
    const pins = page.locator("[role='button'][aria-label*='View']");
    await expect(pins.first()).toBeVisible({ timeout: 10000 });

    // Click on a pin to display listing popup drawer
    await pins.first().click();
    await expect(page.locator("text=from Gate").first()).toBeVisible();
    await expect(page.locator("text=Available Rooms:").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "View Listing" }).first()).toBeVisible();

    // 3. Switch back to Grid view
    await gridBtn.click();
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible();
  });

  test("opens rental inquiry & verification information dialog with appropriate fields and consent", async ({
    page,
  }) => {
    await page.goto("/");

    // Open first listing detail
    const cardLink = page.getByRole("link", { name: "Balangay Student Residences - FSUU Campus" }).first();
    await expect(cardLink).toBeVisible();
    await cardLink.click();
    await page.waitForURL(/\/properties\/.+/);

    // Click Send Inquiry to Landlord
    await page.getByRole("button", { name: "Send Inquiry to Landlord" }).click();

    // Verify Dialog opened with preferred wording
    await expect(
      page.getByRole("heading", { name: "Rental Inquiry & Verification Information" })
    ).toBeVisible();

    // Verify Purpose and Privacy Notice
    await expect(page.getByText("Verification Purpose & Privacy Notice")).toBeVisible();
    await expect(
      page.getByText("This verification information helps the landlord evaluate tenancy fit", { exact: false })
    ).toBeVisible();

    // Verify Form Fields
    await expect(page.getByLabel("Full Name *")).toBeVisible();
    await expect(page.getByLabel("Contact Phone Number *")).toBeVisible();
    await expect(page.getByLabel("Contact Email Address *")).toBeVisible();
    await expect(page.getByLabel("Target Move-In Date")).toBeVisible();
    await expect(page.getByText("Expected Length of Stay *")).toBeVisible();
    await expect(page.getByText("Number of Occupants *")).toBeVisible();
    await expect(page.getByLabel("Message to Landlord *")).toBeVisible();

    // Verify Field explanations / helper texts
    await expect(
      page.getByText("Used by the property owner to formally address you and record your inquiry.")
    ).toBeVisible();
    await expect(
      page.getByText("Needed by the owner to coordinate on-site viewing and gate entry.")
    ).toBeVisible();

    // Verify Consent Checkbox & explanation
    const consentLabel = page.getByText("Authorization & Consent to Share Information *");
    await expect(consentLabel).toBeVisible();
    await expect(
      page.getByText("I authorize Pabulong to share this rental inquiry and verification information", { exact: false })
    ).toBeVisible();

    // Verify client validation prevents empty submission
    const submitBtn = page.getByRole("button", { name: "Submit Inquiry & Details" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Validation alert appears
    await expect(page.getByText("Inquiry Incomplete")).toBeVisible();
  });

  test("handles unauthenticated favorite button safely with sign-in prompt", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Click favorite button on a listing card
    const favButtons = page.getByLabel("Save to favorites");
    await expect(favButtons.first()).toBeVisible({ timeout: 10000 });
    await favButtons.first().click();

    // Toast notice prompting sign-in should appear without fake favorite
    await expect(page.getByText("Sign in required")).toBeVisible();
  });

  test("renders gracefully on mobile viewport (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Check brand header is responsive
    await expect(page.getByText("Pabulong").first()).toBeVisible();

    // Check filter drawer button appears on mobile
    const mobileFilterTrigger = page.getByLabel("Open filter options");
    await expect(mobileFilterTrigger).toBeVisible();

    // Open mobile filter sheet
    await mobileFilterTrigger.click();
    await expect(page.getByRole("heading", { name: "Filter Listings" })).toBeVisible();
    await expect(page.getByText("Campus Proximity")).toBeVisible();

    // Close filter sheet
    await page.getByRole("button", { name: /Apply Filters/i }).click();

    // Check listing cards are responsive and visible
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible();

    // Verify no horizontal overflow on mobile body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});
