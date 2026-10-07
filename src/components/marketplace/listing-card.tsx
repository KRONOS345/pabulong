"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  Sparkles,
  Users,
  Bed,
  ArrowRight,
  Navigation,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import type { BoardingHouse } from "@/lib/marketplace-types";

interface ListingCardProps {
  house: BoardingHouse;
  isFavorited?: boolean;
}

export function ListingCard({ house, isFavorited = false }: ListingCardProps) {
  // Compute minimum monthly rent across rooms or use default
  const startingPrice = React.useMemo(() => {
    if (house.min_rent && house.min_rent > 0) return house.min_rent;
    if (house.rooms && house.rooms.length > 0) {
      const rents = house.rooms.map((r) => r.monthly_rent);
      return Math.min(...rents);
    }
    return null;
  }, [house.min_rent, house.rooms]);

  // Compute total available beds across rooms
  const totalAvailableBeds = React.useMemo(() => {
    if (!house.rooms || house.rooms.length === 0) return 0;
    return house.rooms.reduce((acc, r) => acc + (r.is_available ? r.available_beds : 0), 0);
  }, [house.rooms]);

  // Gender label styling
  const genderLabel = {
    male_only: { label: "Male Only", color: "bg-blue-950/60 text-blue-400 border-blue-500/40" },
    female_only: { label: "Female Only", color: "bg-pink-950/60 text-pink-400 border-pink-500/40" },
    coed: { label: "Co-ed", color: "bg-purple-950/60 text-purple-400 border-purple-500/40" },
  }[house.gender_restriction] || { label: "Co-ed", color: "bg-muted text-muted-foreground" };

  const defaultPhoto = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
  const coverUrl = house.cover_image_url || defaultPhoto;

  return (
    <Card className="group overflow-hidden flex flex-col h-full bg-card border-border/70 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/20 transition-all duration-300">
      {/* Photo Media Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <Link href={`/properties/${house.id}`} className="block w-full h-full">
          <img
            src={coverUrl}
            alt={house.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== defaultPhoto) {
                e.currentTarget.src = defaultPhoto;
              }
            }}
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {house.featured && (
            <Badge className="bg-amber-500/90 hover:bg-amber-500 text-black font-semibold text-[11px] gap-1 px-2 py-0.5 shadow-sm">
              <Sparkles className="h-3 w-3 fill-current" />
              Featured
            </Badge>
          )}
          {house.is_verified && (
            <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium text-[11px] gap-1 px-2 py-0.5 shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>

        {/* Top Right Favorite Button */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="rounded-full bg-background/80 backdrop-blur-md p-0.5 shadow-md">
            <FavoriteButton
              boardingHouseId={house.id}
              initialFavorited={isFavorited}
              size="icon"
              className="h-8 w-8 rounded-full"
            />
          </div>
        </div>

        {/* Bottom Distance/Location Overlay if proximity is calculated */}
        {house.distance_meters !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-foreground font-mono text-[11px] gap-1 shadow-sm">
              <Navigation className="h-3 w-3 text-emerald-500" />
              {house.distance_meters < 1000
                ? `${Math.round(house.distance_meters)}m away`
                : `${(house.distance_meters / 1000).toFixed(1)}km away`}
            </Badge>
          </div>
        )}

        {/* Gender Badge bottom right */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <Badge
            variant="outline"
            className={`backdrop-blur-md text-[11px] font-medium border ${genderLabel.color}`}
          >
            {genderLabel.label}
          </Badge>
        </div>
      </div>

      {/* Card Body */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Barangay / Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              Barangay {house.barangay}, Butuan City
            </span>
          </div>

          {/* House Title */}
          <Link href={`/properties/${house.id}`}>
            <h3 className="font-semibold text-base tracking-tight text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
              {house.name}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {house.description}
          </p>

          {/* Room & Bed stats */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-primary" />
              <span>
                {house.rooms && house.rooms.length > 0
                  ? `${house.rooms.length} room${house.rooms.length > 1 ? "s" : ""}`
                  : "Rooms available"}
              </span>
            </div>
            {totalAvailableBeds > 0 && (
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <Users className="h-3.5 w-3.5" />
                <span>{totalAvailableBeds} bed{totalAvailableBeds > 1 ? "s" : ""} vacant</span>
              </div>
            )}
          </div>

          {/* Amenities Pills */}
          {house.amenities && house.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {house.amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[10px] bg-muted/80 text-muted-foreground px-2 py-0.5 rounded"
                >
                  {amenity}
                </span>
              ))}
              {house.amenities.length > 3 && (
                <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                  +{house.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Card Footer: Pricing and CTA */}
      <CardFooter className="px-4 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-muted-foreground block leading-none">Starting from</span>
          <div className="text-base font-bold text-foreground">
            {startingPrice ? (
              <>
                <span className="text-emerald-400">₱{startingPrice.toLocaleString()}</span>
                <span className="text-[11px] font-normal text-muted-foreground"> /mo</span>
              </>
            ) : (
              <span className="text-xs font-normal text-muted-foreground">Inquire for rates</span>
            )}
          </div>
        </div>

        <Link href={`/properties/${house.id}`}>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 group-hover:border-emerald-500/50 group-hover:bg-emerald-950/20">
            View Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
