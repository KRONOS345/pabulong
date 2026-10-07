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
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).not.toBeVisible();

    // Clear search using clear button or reset
    const clearButton = page.getByLabel("Clear search");
    await clearButton.click();

    // All listings restored
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible();
  });

  test("navigates to listing detail page and displays authentic rooms and landlord data", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on Balangay Residences card
    await page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" }).click();

    // Verify detail page URL
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

  test("opens inquiry dialog with room options and move-in date picker", async ({ page }) => {
    await page.goto("/");

    // Open first listing detail
    await page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" }).click();

    // Click Send Inquiry to Landlord
    await page.getByRole("button", { name: "Send Inquiry to Landlord" }).click();

    // Verify Dialog opened
    await expect(
      page.getByRole("heading", { name: "Send Inquiry to Landlord" })
    ).toBeVisible();
    await expect(page.getByLabel("Message to Landlord *")).toBeVisible();
    await expect(page.getByLabel("Target Move-In Date")).toBeVisible();
  });

  test("handles unauthenticated favorite button safely with sign-in prompt", async ({ page }) => {
    await page.goto("/");

    // Click favorite button on a listing card
    const favButtons = page.getByLabel("Save to favorites");
    await expect(favButtons.first()).toBeVisible();
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
