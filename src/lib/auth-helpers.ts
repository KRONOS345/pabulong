import { auth } from "@clerk/nextjs/server";

/**
 * Returns true if the environment is explicitly configured for offline developer mocks.
 * Dev mocks are STRICTLY DISABLED in production.
 */
export function isDevMockEnabled(): boolean {
  return (
    !process.env.VERCEL &&
    process.env.ENABLE_DEV_MOCKS === "true"
  );
}

/**
 * Checks whether valid Supabase credentials have been configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // Supabase renamed the anon key to "publishable key" for new projects.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  return (
    url.length > 0 &&
    !url.includes("placeholder") &&
    key.length > 10 &&
    !key.includes("placeholder")
  );
}

/**
 * Returns the authenticated Clerk user ID.
 * In production: strictly returns the verified Clerk user ID or null.
 * In local dev with ENABLE_DEV_MOCKS=true: falls back to sandbox dev user ID for testing.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await auth();
    if (session?.userId) {
      return session.userId;
    }
  } catch {
    // Clerk session check failed (unauthenticated or unconfigured key in dev)
  }

  if (isDevMockEnabled()) {
    return process.env.DEV_MOCK_USER_ID || "user_operator_default";
  }

  return null;
}
