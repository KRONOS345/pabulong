import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates an SSR Supabase client scoped to the current user.
 * Automatically requests and attaches the Clerk Supabase JWT so Supabase RLS
 * authenticates the user via `requesting_user_id()`.
 */
export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Called outside an active Next.js request scope
  }

  let token: string | null = null;
  try {
    const session = await auth();
    token = await session.getToken({ template: "supabase" });
  } catch {
    // Unauthenticated, template not yet configured, or outside request scope
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  // Supabase renamed the anon key to "publishable key" for new projects.
  // Accept either variable name for backward compatibility.
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key";

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Parameters<NonNullable<typeof cookieStore>["set"]>[2];
        }>
      ) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore!.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
    global: {
      headers,
    },
  });
}

/**
 * Creates an administrative Supabase client using the service role key.
 * Used exclusively for background tasks, webhooks, and administrative operations.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("placeholder") ||
    serviceRoleKey.includes("placeholder")
  ) {
    throw new Error(
      "Missing Supabase admin credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
