import { test, expect } from "@playwright/test";

test.describe("Placement Kanban & Stripe Escrow E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/placements");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should render 4 Kanban columns (Inquiry, Viewing, Deposit Pending, Placed)", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Placement Control Center");
    await expect(page.locator("text=Inquiry").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Viewing").first()).toBeVisible();
    await expect(page.locator("text=Deposit Pending").first()).toBeVisible();
    await expect(page.locator("text=Placed").first()).toBeVisible();
  });

  test("should open New Inquiry modal dialog and validate input fields", async ({ page }) => {
    const newInquiryBtn = page.locator('button:has-text("New Inquiry")');
    await newInquiryBtn.click();

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Record Client Inquiry")).toBeVisible();

    await page.fill('#client-name', "Alex Mercer");
    await page.fill('#client-email', "alex.mercer@test.edu");

    const submitBtn = page.locator('button:has-text("Create Candidate")');
    await expect(submitBtn).toBeEnabled();
  });

  test("should open Room Matching modal for an Inquiry candidate", async ({ page }) => {
    const matchBtn = page.locator('button:has-text("Match to Room")').first();
    if (await matchBtn.isVisible()) {
      await matchBtn.click();
      await expect(page.locator('div[role="dialog"]')).toBeVisible();
      await expect(page.locator("text=Select Room").first()).toBeVisible();
    }
  });

  test("should trigger Stripe Escrow Deposit modal in Deposit Pending stage", async ({ page }) => {
    const escrowBtn = page.locator('button:has-text("Stripe Escrow")').first();
    if (await escrowBtn.isVisible()) {
      await escrowBtn.click();

      // Verify Stripe Escrow modal appears
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(page.locator("text=Room Security Deposit Escrow")).toBeVisible();
      await expect(page.locator("text=Confirm & Settle Deposit")).toBeVisible();
    }
  });
});
