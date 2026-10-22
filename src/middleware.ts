import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Protected routes requiring authentication in production
// Webhook endpoints (/api/webhooks/*) bypass Clerk session checks
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/owner(.*)",
  "/admin(.*)",
  "/api/((?!webhooks).*)",
]);

const clerkHandler = clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  },
  {
    signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
    signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
  }
);

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Only allow explicit local development mocks where intentionally enabled via ENABLE_DEV_MOCKS="true"
  // (e.g. for offline local development or automated Playwright E2E suites).
  const isDevMock =
    !process.env.VERCEL &&
    process.env.ENABLE_DEV_MOCKS === "true";

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
