import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import {
  verifyAdminSession,
  getAdminMetricsAction,
  getAdminListingsAction,
  approveListingAction,
  rejectListingAction,
  suspendListingAction,
  restoreListingAction,
  toggleUserVerificationAction,
  updateUserRoleAction,
} from "../src/actions/admin";

// Ensure environment variables from .env.local are populated for direct server action tests
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

test.describe("Pabulong Admin Dashboard & Moderation Security Tests", () => {
  // --------------------------------------------------------------------------
  // 1. UNAUTHENTICATED & NON-ADMIN ACCESS CONTROL
  // --------------------------------------------------------------------------

  test("SECURITY: unauthenticated server action call is rejected", async () => {
    // When dev mocks are disabled and no session exists
    process.env.ENABLE_DEV_MOCKS = "false";
    const session = await verifyAdminSession();

    expect(session.isAuthorized).toBe(false);
    expect(session.error).toContain("Authentication required");
  });

  test("SECURITY: non-admin authenticated seeker/owner is rejected by verifyAdminSession", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_seeker_demo";
    process.env.DEV_MOCK_ROLE = "seeker";

    const session = await verifyAdminSession();
    expect(session.isAuthorized).toBe(false);
    expect(session.error).toContain("Administrator privileges are required");
  });

  test("SECURITY: non-admin cannot execute approveListingAction", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_operator_default";
    process.env.DEV_MOCK_ROLE = "owner";

    const result = await approveListingAction("b0000000-0000-0000-0000-000000000001");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Administrator privileges are required");
  });

  test("SECURITY: non-admin cannot execute rejectListingAction", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_seeker_demo";
    process.env.DEV_MOCK_ROLE = "seeker";

    const result = await rejectListingAction(
      "b0000000-0000-0000-0000-000000000001",
      "Illegitimate rejection attempt"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Administrator privileges are required");
  });

  // --------------------------------------------------------------------------
  // 2. ADMIN AUTHORIZATION & MODERATION ACTIONS
  // --------------------------------------------------------------------------

  test("ADMIN WORKFLOW: authorized admin can verify session and retrieve metrics", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    const session = await verifyAdminSession();
    expect(session.isAuthorized).toBe(true);
    expect(session.role).toBe("admin");

    const metrics = await getAdminMetricsAction();
    expect(metrics).toBeDefined();
    expect(metrics.totalListings).toBeGreaterThanOrEqual(0);
    expect(metrics.totalUsers).toBeGreaterThanOrEqual(0);
  });

  test("ADMIN WORKFLOW: approveListingAction marks house as published and verified", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    const houseId = "b0000000-0000-0000-0000-000000000001";
    const result = await approveListingAction(houseId);
    expect(result.success).toBe(true);
  });

  test("ADMIN WORKFLOW: rejectListingAction validates reason length and records rejection", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    const houseId = "b0000000-0000-0000-0000-000000000002";

    // 1. Fails with too short reason
    const shortRes = await rejectListingAction(houseId, "bad");
    expect(shortRes.success).toBe(false);
    expect(shortRes.error).toContain("minimum 5 characters");

    // 2. Succeeds with valid reason
    const validRes = await rejectListingAction(
      houseId,
      "Photos do not show bathroom facilities and room rates lack electricity disclosure."
    );
    expect(validRes.success).toBe(true);
  });

  test("ADMIN WORKFLOW: suspendListingAction and restoreListingAction operate correctly", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    const houseId = "b0000000-0000-0000-0000-000000000003";

    const suspendRes = await suspendListingAction(houseId, "Temporary maintenance violation");
    expect(suspendRes.success).toBe(true);

    const restoreRes = await restoreListingAction(houseId);
    expect(restoreRes.success).toBe(true);
  });

  test("ADMIN WORKFLOW: toggleUserVerificationAction toggles verification badge", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    const targetUserId = "user_seeker_demo";
    const verifyRes = await toggleUserVerificationAction(targetUserId, true);
    expect(verifyRes.success).toBe(true);

    const unverifyRes = await toggleUserVerificationAction(targetUserId, false);
    expect(unverifyRes.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 3. PRIVILEGE ESCALATION & SELF-MODIFICATION GUARDS
  // --------------------------------------------------------------------------

  test("SECURITY: admin cannot alter their own account role (prevents self-demotion/lockout)", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    const result = await updateUserRoleAction("user_admin_test", "seeker");
    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot alter their own account role");
  });

  test("SECURITY: promotion to 'admin' is strictly forbidden via web action", async () => {
    process.env.ENABLE_DEV_MOCKS = "true";
    process.env.DEV_MOCK_USER_ID = "user_admin_test";
    process.env.DEV_MOCK_ROLE = "admin";

    // Attempting to pass 'admin' as role
    const result = await updateUserRoleAction("user_seeker_demo", "admin" as "seeker");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Promotion to 'admin' is prohibited via the web interface");
  });

  // --------------------------------------------------------------------------
  // 4. BROWSER ROUTE & ACCESS DENIED UI TEST
  // --------------------------------------------------------------------------

  test("BROWSER UI: non-admin visiting /admin sees Access Restricted screen", async ({ page }) => {
    // Navigate to /admin where default dev mock is non-admin (user_operator_default / owner)
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Must show Access Restricted / 403 Forbidden screen
    await expect(page.getByRole("heading", { name: "Access Restricted" })).toBeVisible();
    await expect(page.getByText("Seeker Discovery")).toBeVisible();
  });
});
