/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  Edit,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BoardingHouse } from "@/lib/marketplace-types";

interface OwnerPropertyCardProps {
  property: BoardingHouse;
}

export function OwnerPropertyCard({ property }: OwnerPropertyCardProps) {
  const rooms = property.rooms || [];
  const roomCount = rooms.length;
  const availableBeds = rooms.reduce(
    (acc, r) =>
      acc +
      (r.available_beds !== undefined
        ? r.available_beds
        : r.is_available
        ? r.capacity
        : 0),
    0
  );

  const minRent =
    property.min_rent ||
    (rooms.length > 0 ? Math.min(...rooms.map((r) => r.monthly_rent)) : null);

  const coverUrl =
    property.cover_image_url ||
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";

  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-border transition-all flex flex-col group">
      {/* Property Thumbnail & Status Overlay */}
      <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
        <img
          src={coverUrl}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="bg-black/60 backdrop-blur text-white border-white/20 text-xs px-2 py-0.5 gap-1"
          >
            <MapPin className="h-3 w-3 text-emerald-400" />
            {property.barangay}
          </Badge>

          <Badge
            className={`text-xs px-2 py-0.5 capitalize font-medium ${
              property.status === "published"
                ? "bg-emerald-600/90 text-white"
                : property.status === "draft"
                ? "bg-amber-600/90 text-white"
                : "bg-zinc-700/90 text-zinc-200"
            }`}
          >
            {property.status}
          </Badge>
        </div>

        {/* Bottom Title Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-base sm:text-lg leading-tight drop-shadow-sm truncate">
            {property.name}
          </h3>
          <p className="text-xs text-white/80 truncate mt-0.5">
            {property.address}
          </p>
        </div>
      </div>

      {/* Stats Body */}
      <CardContent className="p-4 flex-1 space-y-3">
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center text-xs">
          <div>
            <div className="text-muted-foreground">Rooms</div>
            <div className="font-semibold text-foreground mt-0.5">
              {roomCount}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Available</div>
            <div
              className={`font-semibold mt-0.5 ${
                availableBeds > 0 ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              {availableBeds} beds
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Starting at</div>
            <div className="font-semibold text-foreground mt-0.5">
              {minRent ? `₱${minRent.toLocaleString()}` : "—"}
            </div>
          </div>
        </div>

        {property.gender_restriction && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              Gender:{" "}
              <strong className="text-foreground capitalize font-medium">
                {property.gender_restriction.replace("_", " ")}
              </strong>
            </span>
          </div>
        )}
      </CardContent>

      {/* Action Footer */}
      <CardFooter className="p-4 pt-0 gap-2 flex flex-wrap sm:flex-nowrap">
        <Link
          href={`/owner/properties/${property.id}/rooms`}
          className="flex-1 min-w-[120px]"
        >
          <Button
            variant="default"
            size="sm"
            className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Manage Rooms ({roomCount})
          </Button>
        </Link>

        <Link href={`/owner/properties/${property.id}/edit`}>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs gap-1"
            title="Edit Property"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>

        {property.status === "published" && (
          <Link
            href={`/properties/${property.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="View Public Listing"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
