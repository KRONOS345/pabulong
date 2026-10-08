import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { RoomManager } from "@/components/owner/room-manager";
import { getOwnerPropertyByIdAction } from "@/actions/marketplace";

export const dynamic = "force-dynamic";

interface PropertyRoomsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyRoomsPage({
  params,
}: PropertyRoomsPageProps) {
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
          Back to {property.name}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-emerald-500" />
          {property.name} — Rooms
        </h1>
        <p className="text-sm text-muted-foreground">
          {property.address}, {property.barangay}, Butuan City
        </p>
      </div>

      <RoomManager property={property} />
    </div>
  );
}
