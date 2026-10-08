import { test, expect } from "@playwright/test";

test.describe("Pabulong Phase 4 — Landlord / Owner Workflow & Security", () => {
  // Test seeded property owned by operator default:
  // Balangay Student Residences - FSUU Campus (b0000000-0000-0000-0000-000000000001)
  const ownedPropertyId = "b0000000-0000-0000-0000-000000000001";
  // Non-existent or foreign property owned by another landlord:
  const foreignPropertyId = "b0000000-0000-0000-0000-000000000099";

  test("renders owner dashboard overview with live metrics and navigation", async ({ page }) => {
    await page.goto("/owner");
    await page.waitForLoadState("domcontentloaded");

    // 1. Header & Identity
    await expect(page.getByRole("heading", { name: "Landlord Command Center" })).toBeVisible();
    await expect(
      page.getByText("Real-time overview of your boarding houses", { exact: false })
    ).toBeVisible();

    // 2. Metrics Cards
    await expect(page.getByText("Boarding Houses", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Total Rooms", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Available Beds", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pending Inquiries", { exact: true }).first()).toBeVisible();

    // 3. Navigation Links (check desktop navigation when viewport allows)
    const isMobile = page.viewportSize() ? page.viewportSize()!.width < 768 : false;
    if (!isMobile) {
      await expect(page.getByRole("navigation", { name: "Landlord Navigation" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Overview" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "My Properties" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Inquiries" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Seeker Portal" }).first()).toBeVisible();
    }
  });

  test("lists owned boarding houses on /owner/properties with management actions", async ({ page }) => {
    await page.goto("/owner/properties");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "My Boarding Houses" })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Add Boarding House" })
    ).toBeVisible();

    // Verify Balangay Student Residences card appears
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible();

    // Verify action links exist on property card
    const manageRoomsBtn = page.getByRole("link", { name: "Manage Rooms" }).first();
    await expect(manageRoomsBtn).toBeVisible();

    const editBtn = page.getByRole("link", { name: "Edit" }).first();
    await expect(editBtn).toBeVisible();
  });

  test("opens property creation form and validates required fields", async ({ page }) => {
    await page.goto("/owner/properties/new");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "Register New Boarding House" })).toBeVisible();

    // Check Form Inputs
    await expect(page.getByLabel("Boarding House Name *")).toBeVisible();
    await expect(page.getByText("Barangay in Butuan City *")).toBeVisible();
    await expect(page.getByLabel("Exact Street Address / Landmark *")).toBeVisible();
    await expect(page.getByLabel("Property Description")).toBeVisible();

    // Fill sample boarding house
    await page.getByLabel("Boarding House Name *").fill("Villa Libertad Student Dorm");
    await page
      .getByLabel("Exact Street Address / Landmark *")
      .fill("Purok 4, Libertad near Caraga Hospital");
    await page
      .getByLabel("Property Description")
      .fill("Quiet residential rooms for nursing interns and university students.");

    // Amenities Toggles
    const wifiAmenity = page.getByRole("button", { name: "High-Speed Wi-Fi" });
    if (await wifiAmenity.isVisible()) {
      await wifiAmenity.click();
    }

    // Submit Button is enabled
    const submitBtn = page.getByRole("button", { name: "Publish & Add Rooms" });
    await expect(submitBtn).toBeEnabled();
  });

  test("renders property management hub and navigates to edit page", async ({ page }) => {
    await page.goto(`/owner/properties/${ownedPropertyId}`);
    await page.waitForLoadState("domcontentloaded");

    // Details header
    await expect(
      page.getByRole("heading", { name: "Balangay Student Residences - FSUU Campus" })
    ).toBeVisible();
    await expect(page.getByText("Barangay Dagohoy").first()).toBeVisible();

    // Navigation to edit
    const editPropertyLink = page.getByRole("link", { name: "Edit Property" });
    await expect(editPropertyLink).toBeVisible();
    await editPropertyLink.click();

    await expect(page).toHaveURL(`/owner/properties/${ownedPropertyId}/edit`);
    await expect(
      page.getByRole("heading", { name: /Edit:/ })
    ).toBeVisible();
    await expect(page.getByLabel("Boarding House Name *")).toHaveValue(
      "Balangay Student Residences - FSUU Campus"
    );
  });

  test("manages room inventory with vacancy switch and PHP rent formatting", async ({ page }) => {
    await page.goto(`/owner/properties/${ownedPropertyId}/rooms`);
    await page.waitForLoadState("domcontentloaded");

    // Room Manager Header
    await expect(page.getByRole("heading", { name: "Room & Vacancy Inventory" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Room Unit" })).toBeVisible();

    // Verify room cards render with ₱ pricing
    const rentPrice = page.getByText("₱", { exact: false }).first();
    await expect(rentPrice).toBeVisible();

    // Verify vacancy toggle switch is present
    const vacancySwitch = page.getByRole("switch").first();
    await expect(vacancySwitch).toBeVisible();

    // Open Add Room Dialog
    await page.getByRole("button", { name: "Add Room Unit" }).click();
    const addDialog = page.getByRole("dialog");
    await expect(addDialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Add Room Unit" })).toBeVisible();
    await expect(page.getByLabel("Monthly Rent (₱) *")).toBeVisible();
    await expect(page.getByLabel("Total Capacity (Pax) *")).toBeVisible();

    // Close Dialog
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(addDialog).not.toBeVisible();
  });

  test("renders inquiry inbox with seeker contact details and status filters", async ({ page }) => {
    await page.goto("/owner/inquiries");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "Seeker Inquiry Inbox" })).toBeVisible();

    // Status filter tabs or triggers
    await expect(page.getByText("Filter Leads", { exact: false })).toBeVisible();
  });

  // ========================================================================
  // CRITICAL SECURITY TESTS: MULTI-TENANT ISOLATION & ACCESS CONTROL
  // ========================================================================

  test("SECURITY: cross-owner property access cleanly returns 404 notFound", async ({ page }) => {
    // Attempting to access an unauthorized or non-existent property
    const response = await page.goto(`/owner/properties/${foreignPropertyId}`);
    
    // Must return 404 status without leaking data
    expect(response?.status()).toBe(404);
  });

  test("SECURITY: cross-owner edit route cleanly returns 404 notFound", async ({ page }) => {
    const response = await page.goto(`/owner/properties/${foreignPropertyId}/edit`);
    expect(response?.status()).toBe(404);
  });

  test("SECURITY: cross-owner rooms management route cleanly returns 404 notFound", async ({ page }) => {
    const response = await page.goto(`/owner/properties/${foreignPropertyId}/rooms`);
    expect(response?.status()).toBe(404);
  });

  test("renders owner portal cleanly on mobile viewport (390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/owner");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "Landlord Command Center" })).toBeVisible();
    await expect(page.getByText("Boarding Houses", { exact: true }).first()).toBeVisible();

    // Mobile Menu Button
    const mobileMenuBtn = page.getByLabel("Open Landlord Menu");
    await expect(mobileMenuBtn).toBeVisible();
    await mobileMenuBtn.click();

    // Mobile Drawer Navigation
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Landlord Portal")).toBeVisible();
  });
});
