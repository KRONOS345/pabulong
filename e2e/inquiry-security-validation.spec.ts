import { test, expect } from "@playwright/test";

test.describe("Pabulong Phase 7 — Inquiry Validation & Security Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the first boarding house listing
    await page.goto("/");
    const cardLink = page
      .getByRole("link", { name: "Balangay Student Residences - FSUU Campus" })
      .first();
    await expect(cardLink).toBeVisible();
    await cardLink.click();
    await page.waitForURL(/\/properties\/.+/);

    // Open inquiry dialog
    const inquiryButton = page.getByRole("button", { name: "Send Inquiry to Landlord" });
    await expect(inquiryButton).toBeVisible();
    await inquiryButton.click();

    // Verify dialog is visible
    await expect(
      page.getByRole("heading", { name: "Rental Inquiry & Verification Information" })
    ).toBeVisible();
  });

  test("SECURITY: rejects inquiry submission when consent is omitted", async ({ page }) => {
    // Fill all fields except consent
    await page.getByLabel("Full Name *").fill("Juan Dela Cruz");
    await page.getByLabel("Contact Phone Number *").fill("09171234567");
    await page.getByLabel("Contact Email Address *").fill("juan@fsuu.edu.ph");
    await page.getByLabel("Message to Landlord *").fill("Inquiring about solo room availability.");

    // Ensure consent is unchecked
    const consentCheckbox = page.getByRole("checkbox", {
      name: "Authorization & Consent to Share Information *",
    });
    await expect(consentCheckbox).not.toBeChecked();

    // Attempt submission
    const submitBtn = page.getByRole("button", { name: "Submit Inquiry & Details" });
    await submitBtn.click();

    // Validation alert must be displayed
    await expect(page.getByText("Inquiry Incomplete")).toBeVisible();
    await expect(page.getByText("Please provide your consent", { exact: false })).toBeVisible();
  });

  test("DATA VALIDATION: rejects inquiry submission when contact phone is invalid", async ({
    page,
  }) => {
    await page.getByLabel("Full Name *").fill("Juan Dela Cruz");
    await page.getByLabel("Contact Phone Number *").fill("abc"); // Invalid phone
    await page.getByLabel("Contact Email Address *").fill("juan@fsuu.edu.ph");
    await page.getByLabel("Message to Landlord *").fill("Testing invalid phone validation.");

    // Check consent
    const consentCheckbox = page.getByRole("checkbox", {
      name: "Authorization & Consent to Share Information *",
    });
    await consentCheckbox.check();

    // Submit
    const submitBtn = page.getByRole("button", { name: "Submit Inquiry & Details" });
    await submitBtn.click();

    // Validation alert must catch invalid phone
    await expect(page.getByText("Inquiry Incomplete")).toBeVisible();
    await expect(page.getByText("A valid contact phone number is required", { exact: false })).toBeVisible();
  });

  test("DATA VALIDATION: rejects inquiry submission when email address is malformed", async ({
    page,
  }) => {
    await page.getByLabel("Full Name *").fill("Juan Dela Cruz");
    await page.getByLabel("Contact Phone Number *").fill("09171234567");
    await page.getByLabel("Contact Email Address *").fill("invalid-email-no-at-domain");
    await page.getByLabel("Message to Landlord *").fill("Testing invalid email validation.");

    const consentCheckbox = page.getByRole("checkbox", {
      name: "Authorization & Consent to Share Information *",
    });
    await consentCheckbox.check();

    const submitBtn = page.getByRole("button", { name: "Submit Inquiry & Details" });
    await submitBtn.click();

    await expect(page.getByText("Inquiry Incomplete")).toBeVisible();
    await expect(page.getByText("A valid email address is required", { exact: false })).toBeVisible();
  });

  test("SECURITY: neutralizes XSS payloads in inquiry fields without script execution", async ({
    page,
  }) => {
    const xssPayload = "<script>window.__XSS_TRIGGERED__ = true;</script>";
    const imgXss = "<img src=x onerror=\"window.__XSS_IMG__ = true;\" />";

    await page.getByLabel("Full Name *").fill("SecTester " + imgXss);
    await page.getByLabel("Contact Phone Number *").fill("09171234567");
    await page.getByLabel("Contact Email Address *").fill("sec@fsuu.edu.ph");
    await page.getByLabel("Renter Profile & Background (Optional)").fill(xssPayload);
    await page.getByLabel("Message to Landlord *").fill("Testing XSS neutralization: " + xssPayload);

    const consentCheckbox = page.getByRole("checkbox", {
      name: "Authorization & Consent to Share Information *",
    });
    await consentCheckbox.check();

    // Submit inquiry with XSS payload
    const submitBtn = page.getByRole("button", { name: "Submit Inquiry & Details" });
    await submitBtn.click();

    // Verify no script execution occurred in browser window context
    const xssFlag = await page.evaluate(() => (window as unknown as Record<string, unknown>).__XSS_TRIGGERED__);
    const imgXssFlag = await page.evaluate(() => (window as unknown as Record<string, unknown>).__XSS_IMG__);

    expect(xssFlag).toBeUndefined();
    expect(imgXssFlag).toBeUndefined();
  });

  test("SECURITY: unauthenticated submission is rejected by Supabase Row Level Security policy", async ({
    page,
  }) => {
    await page.getByLabel("Full Name *").fill("Maria Santos");
    await page.getByLabel("Contact Phone Number *").fill("0918 987 6543");
    await page.getByLabel("Contact Email Address *").fill("maria.santos@urios.edu.ph");
    await page.getByLabel("Renter Profile & Background (Optional)").fill("3rd year Accountancy student");
    await page.getByLabel("Message to Landlord *").fill(
      "Good day! May I schedule an on-site viewing this Saturday afternoon?"
    );

    const consentCheckbox = page.getByRole("checkbox", {
      name: "Authorization & Consent to Share Information *",
    });
    await consentCheckbox.check();

    const submitBtn = page.getByRole("button", { name: "Submit Inquiry & Details" });
    await submitBtn.click();

    // Verify submission is securely intercepted by Supabase RLS or auth check
    await expect(page.getByText("Inquiry Incomplete")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/violates row-level security policy|Authentication required/i).first()
    ).toBeVisible();
  });
});
