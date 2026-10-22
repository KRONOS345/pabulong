"use client";

import * as React from "react";
import {
  MapPin,
  ExternalLink,
  GraduationCap,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import {
  isValidCoordinate,
  findNearestCampus,
} from "@/lib/google-maps";
import { InteractiveMap } from "@/components/properties/interactive-map";
import type { BoardingHouse } from "@/lib/marketplace-types";

interface PropertyLocationMapProps {
  house: BoardingHouse;
  className?: string;
}

export function PropertyLocationMap({ house, className = "" }: PropertyLocationMapProps) {
  const hasCoordinates = isValidCoordinate(house.latitude, house.longitude);
  const nearestCampus = React.useMemo(() => {
    return findNearestCampus(house.latitude, house.longitude);
  }, [house.latitude, house.longitude]);

  // Google Maps external directions URL with exact lat/lng destination
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${house.latitude},${house.longitude}&travelmode=walking`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${house.name}, ${house.address}, Barangay ${house.barangay}, Butuan City`
      )}`;

  return (
    <section className={`space-y-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm ${className}`} aria-labelledby="location-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 id="location-heading" className="text-xl font-bold tracking-tight text-foreground">
              Location & Neighborhood
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Barangay {house.barangay}, Butuan City, Agusan del Norte
          </p>
        </div>

        {/* Directions External CTA */}
        <div className="flex items-center gap-2">
          {nearestCampus && (
            <Badge variant="outline" className="text-xs px-2.5 py-1 bg-primary/5 text-primary border-primary/20 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>
                {nearestCampus.distanceFormatted} to {nearestCampus.campus.shortName}
              </span>
            </Badge>
          )}

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs h-9 rounded-xl border-border/80 hover:bg-muted font-medium inline-flex items-center"
            )}
          >
            <span>Get Directions</span>
            <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {hasCoordinates ? (
        <div className="space-y-3">
          <InteractiveMap
            properties={[house]}
            selectedPropertyId={house.id}
            center={{
              lat: house.latitude,
              lng: house.longitude,
              name: house.name,
            }}
            className="h-[360px] sm:h-[420px] rounded-xl"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
            <span className="font-mono text-[11px]">
              GPS: {house.latitude?.toFixed(4)}° N, {house.longitude?.toFixed(4)}° E
            </span>
            <span>Street: {house.address}</span>
          </div>
        </div>
      ) : (
        /* Explicit Location Not Provided Fallback State */
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
            <Compass className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Exact Map Coordinates Not Provided
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              The landlord has registered this property in <strong>Barangay {house.barangay}</strong> at{" "}
              <strong>{house.address}</strong>, but has not set exact GPS coordinates on the map.
            </p>
          </div>
          <div className="pt-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs h-8 rounded-lg inline-flex items-center"
              )}
            >
              Search Street on Google Maps <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
