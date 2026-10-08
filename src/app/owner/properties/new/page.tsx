import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { PropertyForm } from "@/components/owner/property-form";

export const dynamic = "force-dynamic";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-border/40">
        <Link
          href="/owner/properties"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Boarding Houses
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-emerald-500" />
          Register New Boarding House
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your boarding house or student dormitory details located within Butuan City.
        </p>
      </div>

      <PropertyForm />
    </div>
  );
}
