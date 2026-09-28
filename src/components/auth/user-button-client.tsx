"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";

const emptySubscribe = () => () => {};

export function HeaderUserButton() {
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const isDummyClerk =
    !pubKey ||
    pubKey.includes("dummy") ||
    pubKey.includes("placeholder") ||
    pubKey.includes("ZXhhbXBsZS");

  if (!isClient || isDummyClerk) {
    return (
      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm ring-2 ring-indigo-500/20">
        OP
      </div>
    );
  }

  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "h-8 w-8 ring-2 ring-indigo-500/20",
        },
      }}
    />
  );
}
