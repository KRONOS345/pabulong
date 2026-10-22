"use client";

import * as React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[AdminError] Uncaught boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/80 bg-card/60 backdrop-blur shadow-sm text-center">
        <CardContent className="pt-6 pb-6 px-6 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Admin Console Error
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || "An unexpected error occurred while loading administrative data."}
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
            <Button size="sm" onClick={() => reset()} className="gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </Button>
            <Link href="/">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Home className="h-3.5 w-3.5" />
                Seeker Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
