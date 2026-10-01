import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Protected routes requiring authentication in production
// Webhook endpoints (/api/webhooks/*) bypass Clerk session checks
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/((?!webhooks).*)"
]);

// Only allow explicit local development mocks when intentionally enabled via ENABLE_DEV_MOCKS="true"
// (e.g. for offline local development or automated Playwright E2E suites).
// On deployed environments (e.g. VERCEL=1 or production without explicit flag), this is disabled.
// Authentication is NEVER bypassed merely because a key starts with "pk_test_".
const isDevMock =
  !process.env.VERCEL &&
  process.env.ENABLE_DEV_MOCKS === "true";

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Only allow explicit local development mocks where intentionally enabled
  if (isDevMock) {
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
