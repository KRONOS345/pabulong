import * as React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const isDummyClerk =
    !pubKey ||
    pubKey.includes("dummy") ||
    pubKey.includes("placeholder") ||
    pubKey.includes("ZXhhbXBsZS");

  if (isDummyClerk) {
    // In local dev without real Clerk credentials, bypass ClerkProvider
    // to prevent Clerk's "Invalid Host" full-screen error overlay
    return <>{children}</>;
  }

  return (
    <ClerkProvider
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
