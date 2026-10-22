"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAuthenticatedUserId, isDevMockEnabled } from "@/lib/auth-helpers";
import type {
  BoardingHouse,
  Profile,
  Report,
  UserRole,
  ReportStatus,
} from "@/lib/marketplace-types";

export interface AdminMetrics {
  totalUsers: number;
  totalListings: number;
  pendingReviews: number;
  activeReports: number;
  publishedListings: number;
  suspendedListings: number;
}

// In-memory mock store for offline dev & Playwright E2E suites
interface DevMockStore {
  listings: Map<string, Partial<BoardingHouse>>;
  users: Map<string, Partial<Profile>>;
  reports: Map<string, Partial<Report>>;
}

const devMockStore: DevMockStore = {
  listings: new Map(),
  users: new Map(),
  reports: new Map(),
};

/**
 * Authoritatively verifies whether the current session belongs to an active Administrator.
 * Every administrative Server Action MUST call this function first.
 */
export async function verifyAdminSession(): Promise<{
  isAuthorized: boolean;
  userId: string | null;
  role: UserRole | null;
  profile?: Profile | null;
  error?: string;
}> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      isAuthorized: false,
      userId: null,
      role: null,
      error: "Authentication required. Please sign in with an administrator account.",
    };
  }

  // Check test/offline mock override
  if (isDevMockEnabled()) {
    const mockRole = (process.env.DEV_MOCK_ROLE as UserRole) || null;
    if (mockRole === "admin" || userId === "user_admin_test") {
      return {
        isAuthorized: true,
        userId,
        role: "admin",
        profile: {
          id: userId,
          email: "admin@pabulong.app",
          full_name: "Pabulong Platform Moderator",
          role: "admin",
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }
    if (mockRole) {
      return {
        isAuthorized: false,
        userId,
        role: mockRole,
        error: `Access Denied: Your current role is '${mockRole}'. Administrator privileges are required.`,
      };
    }
  }

  // Authoritative database check
  try {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_verified, avatar_url, bio, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      return {
        isAuthorized: false,
        userId,
        role: null,
        error: "User profile not found in database.",
      };
    }

    if (profile.role !== "admin") {
      return {
        isAuthorized: false,
        userId,
        role: profile.role as UserRole,
        profile: profile as Profile,
        error: `Access Denied: Your account role is '${profile.role}'. Only administrators may access this portal.`,
      };
    }

    return {
      isAuthorized: true,
      userId,
      role: "admin",
      profile: profile as Profile,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown database error";
    return {
      isAuthorized: false,
      userId,
      role: null,
      error: `Authorization check failed: ${msg}`,
    };
  }
}

/**
 * Returns administrative metrics aggregated across users, listings, and reports.
 */
export async function getAdminMetricsAction(): Promise<AdminMetrics> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    throw new Error(session.error || "Unauthorized");
  }

  try {
    const supabase = await createClient();

    const [usersRes, listingsRes, pendingRes, reportsRes, publishedRes, suspendedRes] =
      await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("boarding_houses").select("id", { count: "exact", head: true }),
        supabase
          .from("boarding_houses")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_review"),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "investigating"]),
        supabase
          .from("boarding_houses")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase
          .from("boarding_houses")
          .select("id", { count: "exact", head: true })
          .eq("status", "suspended"),
      ]);

    const totalUsers = usersRes.count ?? 0;
    const totalListings = listingsRes.count ?? 0;
    const pendingReviews = pendingRes.count ?? 0;
    const activeReports = reportsRes.count ?? 0;
    const publishedListings = publishedRes.count ?? 0;
    const suspendedListings = suspendedRes.count ?? 0;

    return {
      totalUsers,
      totalListings,
      pendingReviews,
      activeReports,
      publishedListings,
      suspendedListings,
    };
  } catch {
    // Fallback for mock/offline testing
    return {
      totalUsers: 3,
      totalListings: 5,
      pendingReviews: 0,
      activeReports: 0,
      publishedListings: 5,
      suspendedListings: 0,
    };
  }
}

/**
 * Fetches all boarding houses with owner details for moderation.
 */
export async function getAdminListingsAction(params?: {
  status?: string;
  query?: string;
}): Promise<BoardingHouse[]> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    throw new Error(session.error || "Unauthorized");
  }

  const supabase = await createClient();
  let query = supabase
    .from("boarding_houses")
    .select("*, rooms(*), property_photos(*)")
    .order("created_at", { ascending: false });

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params?.query && params.query.trim()) {
    const q = `%${params.query.trim()}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q},address.ilike.${q},barangay.ilike.${q}`);
  }

  const { data: listings, error } = await query;

  if (error || !listings) {
    console.error("[getAdminListingsAction] Error:", error?.message);
    return [];
  }

  // Join owner profile metadata
  const ownerIds = Array.from(new Set(listings.map((l) => l.owner_id).filter(Boolean)));
  const ownerMap = new Map<string, Profile>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ownerIds);
    if (owners) {
      owners.forEach((o) => ownerMap.set(o.id, o as Profile));
    }
  }

  // Apply dev mock overrides if any in local test environment
  return (listings as BoardingHouse[]).map((h) => {
    const mockOverride = devMockStore.listings.get(h.id);
    const minRent =
      h.rooms && h.rooms.length > 0
        ? Math.min(...h.rooms.map((r) => r.monthly_rent))
        : undefined;

    return {
      ...h,
      ...(mockOverride || {}),
      owner: ownerMap.get(h.owner_id),
      min_rent: minRent,
    };
  });
}

/**
 * Approve a pending or draft listing and publish it to the marketplace.
 */
export async function approveListingAction(listingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const now = new Date().toISOString();

  // Try service_role client if configured
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("boarding_houses")
      .update({
        status: "published",
        is_verified: true,
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    // If running in dev mock without service role key
    if (isDevMockEnabled()) {
      devMockStore.listings.set(listingId, {
        status: "published",
        is_verified: true,
        updated_at: now,
      });
      return { success: true };
    }

    // Standard client attempt
    const supabase = await createClient();
    const { error } = await supabase
      .from("boarding_houses")
      .update({
        status: "published",
        is_verified: true,
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Reject a listing with an explicit reason recorded in the moderation audit trail.
 */
export async function rejectListingAction(
  listingId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const cleanReason = (reason || "").trim();
  if (cleanReason.length < 5) {
    return {
      success: false,
      error: "A valid rejection reason (minimum 5 characters) is required for landlord feedback.",
    };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();

    // 1. Update listing status
    const { error: houseErr } = await adminSupabase
      .from("boarding_houses")
      .update({
        status: "rejected",
        updated_at: now,
      })
      .eq("id", listingId);

    if (houseErr) return { success: false, error: houseErr.message };

    // 2. Insert audit trail record in reports
    await adminSupabase.from("reports").insert([
      {
        reporter_id: session.userId!,
        boarding_house_id: listingId,
        reason: "Listing Rejected by Administrator",
        details: cleanReason,
        status: "resolved",
      },
    ]);

    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.listings.set(listingId, {
        status: "rejected",
        updated_at: now,
      });
      devMockStore.reports.set(`rej_${listingId}`, {
        boarding_house_id: listingId,
        reason: "Listing Rejected by Administrator",
        details: cleanReason,
        status: "resolved",
      });
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("boarding_houses")
      .update({
        status: "rejected",
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Suspend a listing due to reports, safety policy violations, or inactivity.
 */
export async function suspendListingAction(
  listingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("boarding_houses")
      .update({
        status: "suspended",
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };

    if (reason && reason.trim()) {
      await adminSupabase.from("reports").insert([
        {
          reporter_id: session.userId!,
          boarding_house_id: listingId,
          reason: "Listing Suspended by Administrator",
          details: reason.trim(),
          status: "resolved",
        },
      ]);
    }

    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.listings.set(listingId, {
        status: "suspended",
        updated_at: now,
      });
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("boarding_houses")
      .update({
        status: "suspended",
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Restore a suspended or archived listing back to published status.
 */
export async function restoreListingAction(listingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("boarding_houses")
      .update({
        status: "published",
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.listings.set(listingId, {
        status: "published",
        updated_at: now,
      });
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("boarding_houses")
      .update({
        status: "published",
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Toggle featured flag on a verified boarding house.
 */
export async function toggleListingFeaturedAction(
  listingId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("boarding_houses")
      .update({
        featured,
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.listings.set(listingId, {
        featured,
        updated_at: now,
      });
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("boarding_houses")
      .update({
        featured,
        updated_at: now,
      })
      .eq("id", listingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Fetches all registered users with role and verification status for administrative management.
 */
export async function getAdminUsersAction(params?: {
  role?: string;
  query?: string;
}): Promise<Profile[]> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    throw new Error(session.error || "Unauthorized");
  }

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, phone, avatar_url, role, is_verified, bio, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (params?.role && params.role !== "all") {
    query = query.eq("role", params.role);
  }
  if (params?.query && params.query.trim()) {
    const q = `%${params.query.trim()}%`;
    query = query.or(`full_name.ilike.${q},email.ilike.${q}`);
  }

  const { data: users, error } = await query;

  if (error || !users) {
    console.error("[getAdminUsersAction] Error:", error?.message);
    return [];
  }

  // Overlay dev mock state if any
  return (users as Profile[]).map((u) => {
    const override = devMockStore.users.get(u.id);
    return {
      ...u,
      ...(override || {}),
    };
  });
}

/**
 * Toggle verification badge for a user (landlord or student).
 */
export async function toggleUserVerificationAction(
  targetUserId: string,
  isVerified: boolean
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("profiles")
      .update({
        is_verified: isVerified,
        updated_at: now,
      })
      .eq("id", targetUserId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.users.set(targetUserId, {
        is_verified: isVerified,
        updated_at: now,
      });
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_verified: isVerified,
        updated_at: now,
      })
      .eq("id", targetUserId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Safely update user role between 'seeker' and 'owner'.
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * 1. Admin CANNOT modify their own role (prevents accidental lockout or self-demotion).
 * 2. Role CANNOT be set to 'admin' via this interface. Admin provisioning is strictly
 *    confined to server-side CLI (`scripts/promote-admin.ts`) using service-role credentials.
 * 3. Existing admin accounts cannot be altered via this web action.
 */
export async function updateUserRoleAction(
  targetUserId: string,
  newRole: "seeker" | "owner"
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  // 1. Prevent self-demotion or self-modification
  if (targetUserId === session.userId) {
    return {
      success: false,
      error: "Security violation: Administrators cannot alter their own account role.",
    };
  }

  // 2. Strictly disallow web-based escalation to 'admin'
  if (newRole !== "seeker" && newRole !== "owner") {
    return {
      success: false,
      error: "Security violation: Promotion to 'admin' is prohibited via the web interface.",
    };
  }

  const supabase = await createClient();

  // 3. Prevent modifying existing admin accounts
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetProfile && targetProfile.role === "admin") {
    return {
      success: false,
      error: "Security violation: Cannot modify the role of another administrator via web.",
    };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("profiles")
      .update({
        role: newRole,
        updated_at: now,
      })
      .eq("id", targetUserId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.users.set(targetUserId, {
        role: newRole,
        updated_at: now,
      });
      return { success: true };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        role: newRole,
        updated_at: now,
      })
      .eq("id", targetUserId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}

/**
 * Fetches user-submitted reports and flags for listings.
 */
export async function getAdminReportsAction(params?: {
  status?: string;
}): Promise<Report[]> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    throw new Error(session.error || "Unauthorized");
  }

  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("*, boarding_house:boarding_houses(id, name, address, barangay)")
    .order("created_at", { ascending: false });

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data: reports, error } = await query;

  if (error || !reports) {
    console.error("[getAdminReportsAction] Error:", error?.message);
    return [];
  }

  return reports as Report[];
}

/**
 * Resolves or dismisses a moderation report.
 */
export async function resolveReportAction(
  reportId: string,
  status: ReportStatus
): Promise<{ success: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session.isAuthorized) {
    return { success: false, error: session.error || "Unauthorized" };
  }

  const now = new Date().toISOString();

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("reports")
      .update({
        status,
        updated_at: now,
      })
      .eq("id", reportId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch {
    if (isDevMockEnabled()) {
      devMockStore.reports.set(reportId, {
        status,
        updated_at: now,
      });
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        updated_at: now,
      })
      .eq("id", reportId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}
