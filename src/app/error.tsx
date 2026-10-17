"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Pabulong Application Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-destructive/30 bg-card p-6 sm:p-8 shadow-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/15 text-destructive border border-destructive/25 flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-semibold text-destructive uppercase tracking-widest">
            Application Error
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this view. You can try reloading or return to the marketplace home.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs h-9"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full gap-2 border-border/80 text-xs h-9"
            >
              <Home className="h-3.5 w-3.5" />
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
