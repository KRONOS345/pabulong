import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { PropertyForm } from "@/components/owner/property-form";
import { getOwnerPropertyByIdAction } from "@/actions/marketplace";

export const dynamic = "force-dynamic";

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const { id } = await params;
  const property = await getOwnerPropertyByIdAction(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-border/40">
        <Link
          href={`/owner/properties/${property.id}`}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Property Overview
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Edit className="h-7 w-7 text-emerald-500" />
          Edit: {property.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update boarding house policies, amenities, contact details, or location information.
        </p>
      </div>

      <PropertyForm initialData={property} isEdit={true} />
    </div>
  );
}
