"use client";

import * as React from "react";
import {
  FilterBar,
  MarketplaceFilters,
  DEFAULT_FILTERS,
  BUTUAN_CAMPUSES,
} from "@/components/marketplace/filter-bar";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchListings,
  getUserFavoriteIdsAction,
} from "@/actions/marketplace";
import type { BoardingHouse } from "@/lib/marketplace-types";
import { AlertCircle, RotateCcw, Home, Building2 } from "lucide-react";

interface DiscoveryFeedProps {
  initialListings: BoardingHouse[];
  initialFavoriteIds: string[];
}

export function DiscoveryFeed({
  initialListings,
  initialFavoriteIds,
}: DiscoveryFeedProps) {
  const [filters, setFilters] = React.useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [listings, setListings] = React.useState<BoardingHouse[]>(initialListings);
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>(initialFavoriteIds);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState<"recommended" | "price_asc" | "price_desc" | "distance">("recommended");

  // Keep favorite IDs updated if user logs in
  React.useEffect(() => {
    getUserFavoriteIdsAction()
      .then((ids) => setFavoriteIds(ids))
      .catch(() => {});
  }, []);

  // Fetch listings whenever filters change
  const fetchListings = React.useCallback(async (currentFilters: MarketplaceFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const selectedCampus = BUTUAN_CAMPUSES.find((c) => c.id === currentFilters.campusId);

      const params = {
        query: currentFilters.query.trim() || undefined,
        barangay: currentFilters.barangay !== "all" ? currentFilters.barangay : undefined,
        gender_restriction: currentFilters.gender !== "all" ? currentFilters.gender : undefined,
        room_type: currentFilters.roomType !== "all" ? currentFilters.roomType : undefined,
        max_rent: currentFilters.maxRent < 8000 ? currentFilters.maxRent : undefined,
        campus_lat: selectedCampus?.lat,
        campus_lng: selectedCampus?.lng,
        radius_meters: 25000,
      };

      const results = await searchListings(params);
      setListings(results);
    } catch (err: unknown) {
      console.error("[DiscoveryFeed] fetch error:", err);
      setError("Unable to load boarding houses. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search trigger
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(filters);
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, fetchListings]);

  // Sort processed listings
  const sortedListings = React.useMemo(() => {
    const copy = [...listings];
    if (sortBy === "price_asc") {
      return copy.sort((a, b) => (a.min_rent || 0) - (b.min_rent || 0));
    }
    if (sortBy === "price_desc") {
      return copy.sort((a, b) => (b.min_rent || 0) - (a.min_rent || 0));
    }
    if (sortBy === "distance") {
      return copy.sort((a, b) => (a.distance_meters || 999999) - (b.distance_meters || 999999));
    }
    // Default: Featured first, then newest
    return copy.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [listings, sortBy]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters Container */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          totalResults={sortedListings.length}
        />
      </div>

      {/* Discovery Meta Bar (Result counter & Sort selector) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-foreground">
            {isLoading ? "Searching available spaces..." : `${sortedListings.length} Boarding Houses Available`}
          </span>
          {filters.barangay !== "all" && (
            <span className="text-muted-foreground text-xs">
              in Barangay {filters.barangay}
            </span>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(v: "recommended" | "price_asc" | "price_desc" | "distance" | null) => {
              if (v) setSortBy(v);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
              <SelectValue>
                {(val) => {
                  const map: Record<string, string> = {
                    recommended: "Featured / Newest",
                    price_asc: "Price: Low to High",
                    price_desc: "Price: High to Low",
                    distance: "Nearest to Campus",
                  };
                  return map[val as string] || "Featured / Newest";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Featured / Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="distance">Nearest to Campus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* State 1: Error State */}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center space-y-3" role="alert">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground text-base">Error Loading Listings</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchListings(filters)}
            className="gap-1.5 text-xs h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      )}

      {/* State 2: Loading Skeletons */}
      {isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/60 bg-card overflow-hidden space-y-3 p-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* State 3: Empty State */}
      {!isLoading && !error && sortedListings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 px-4 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Home className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-foreground">
              No Boarding Houses Found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any rental properties matching your active filters. Try broadening your budget or clearing campus/barangay restrictions.
            </p>
          </div>
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="gap-2 h-9 text-xs font-medium"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </Button>
        </div>
      )}

      {/* State 4: Real Seeded Listings Grid */}
      {!isLoading && !error && sortedListings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedListings.map((house) => (
            <ListingCard
              key={house.id}
              house={house}
              isFavorited={favoriteIds.includes(house.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
