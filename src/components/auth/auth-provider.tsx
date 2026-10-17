import * as React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_ZXhhbXBsZS1hcHAtMTIuY2xlcmsuYWNjb3VudHMuZGV2JA==";

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"}
      signInFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ||
        "/dashboard"
      }
      signUpFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ||
        "/dashboard"
      }
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-indigo-600 hover:bg-indigo-700 text-sm normal-case",
          card: "bg-slate-900 border border-slate-800 shadow-xl",
          headerTitle: "text-white font-semibold",
          headerSubtitle: "text-slate-400 text-sm",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
