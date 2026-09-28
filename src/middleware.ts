import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Protected routes requiring authentication in production
// Webhook endpoints (/api/webhooks/*) bypass Clerk session checks
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/((?!webhooks).*)"
]);

const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
// Pass through gracefully when:
// - No key set
// - Placeholder/dummy keys (local dev)
// - Test-domain keys (pk_test_*) — these are Clerk dev-instance keys that
//   only work on localhost or the configured Clerk dev domain, not on
//   production .vercel.app domains. Use pk_live_* keys for production.
const isDevPlaceholder =
  !pubKey ||
  pubKey.startsWith("pk_test_") ||
  pubKey.includes("dummy") ||
  pubKey.includes("placeholder") ||
  pubKey.includes("ZXhhbXBsZS");

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // In local development or test mode with unconfigured placeholder keys,
  // pass through gracefully to prevent Clerk "Invalid Host" errors
  if (isDevPlaceholder) {
    return NextResponse.next();
  }

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
