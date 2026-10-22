"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, Home, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface AccessDeniedProps {
  currentRole?: string;
  errorMessage?: string;
}

export function AccessDenied({
  currentRole = "seeker",
  errorMessage,
}: AccessDeniedProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/80 bg-card/60 backdrop-blur shadow-lg">
        <CardContent className="pt-8 pb-6 px-6 text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Access Restricted
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {errorMessage ||
                "This administrative command console is strictly restricted to authorized platform moderators."}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/60 text-xs text-muted-foreground">
            <span>Your current role:</span>
            <Badge
              variant="outline"
              className="capitalize font-semibold text-xs px-2 py-0.5 border-border"
            >
              {currentRole}
            </Badge>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="default" className="w-full gap-2 text-sm font-medium">
                <Home className="h-4 w-4" />
                Seeker Discovery
              </Button>
            </Link>

            {currentRole === "owner" && (
              <Link href="/owner" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Landlord Portal
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
