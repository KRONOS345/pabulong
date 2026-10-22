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
import {
  AlertCircle,
  RotateCcw,
  Home,
  Building2,
  LayoutGrid,
  Map as MapIcon,
  Columns2,
} from "lucide-react";
import { InteractiveMap } from "@/components/properties/interactive-map";

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
  const [viewMode, setViewMode] = React.useState<"grid" | "split" | "map">("grid");
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = React.useState<string | null>(null);

  const activeCampus = React.useMemo(() => {
    return BUTUAN_CAMPUSES.find((c) => c.id === filters.campusId);
  }, [filters.campusId]);

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
    <div className="space-y-6 max-w-full overflow-x-clip">
      {/* Search & Filters Container */}
      <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md p-4 sm:p-6 shadow-sm">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          totalResults={sortedListings.length}
        />
      </div>

      {/* Discovery Meta Bar (Result counter & Sort selector) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm pt-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-foreground">
              {isLoading ? "Searching available spaces..." : `${sortedListings.length} Boarding Houses`}
            </span>
            {filters.barangay !== "all" && (
              <span className="text-muted-foreground text-xs ml-1.5 font-normal">
                in Barangay {filters.barangay}
              </span>
            )}
          </div>
        </div>

        {/* View Mode Toggle & Sort Options */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/70">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-md font-medium"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-md font-medium hidden md:flex"
              aria-label="Split view with map"
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>Split Map</span>
            </Button>
            <Button
              variant={viewMode === "map" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("map")}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-md font-medium"
              aria-label="Full map view"
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Map</span>
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Sort:</span>
            <Select
              value={sortBy}
              onValueChange={(v: "recommended" | "price_asc" | "price_desc" | "distance" | null) => {
                if (v) setSortBy(v);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[160px] bg-background border-border/80 rounded-lg">
                <SelectValue>
                  {(val) => {
                    const map: Record<string, string> = {
                      recommended: "Featured / Recommended",
                      price_asc: "Price: Low to High",
                      price_desc: "Price: High to Low",
                      distance: "Nearest to Campus",
                    };
                    return map[val as string] || "Featured / Recommended";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Featured / Recommended</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="distance">Nearest to Campus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* State 1: Error State */}
      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center space-y-3" role="alert">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground text-base">Error Loading Boarding Houses</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchListings(filters)}
            className="gap-1.5 text-xs h-8 rounded-lg mt-2"
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
              className="rounded-2xl border border-border/70 bg-card overflow-hidden p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* State 3: Empty State */}
      {!isLoading && !error && sortedListings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 px-4 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Home className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-foreground">
              No Boarding Houses Found
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We couldn&apos;t find any rental properties matching your active filters. Try broadening your monthly budget or clearing specific campus restrictions.
            </p>
          </div>
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="gap-2 h-9 text-xs font-medium rounded-lg"
          >
            <RotateCcw className="h-3.5 w-3.5 text-primary" />
            Reset All Filters
          </Button>
        </div>
      )}

      {/* State 4: Real Seeded Listings (Grid, Split, or Full Map) */}
      {!isLoading && !error && sortedListings.length > 0 && (
        <>
          {/* Mode 1: Standard Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedListings.map((house, idx) => (
                <ListingCard
                  key={house.id}
                  house={house}
                  isFavorited={favoriteIds.includes(house.id)}
                  priority={idx < 3}
                />
              ))}
            </div>
          )}

          {/* Mode 2: Split View (Listings on left, Interactive Map on right) */}
          {viewMode === "split" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-4 max-h-[720px] overflow-y-auto pr-1">
                {sortedListings.map((house, idx) => (
                  <div
                    key={house.id}
                    onMouseEnter={() => setHoveredPropertyId(house.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    onClick={() => setSelectedPropertyId(house.id)}
                  >
                    <ListingCard
                      house={house}
                      isFavorited={favoriteIds.includes(house.id)}
                      priority={idx < 2}
                    />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-6 sticky top-20">
                <InteractiveMap
                  properties={sortedListings}
                  selectedPropertyId={selectedPropertyId}
                  hoveredPropertyId={hoveredPropertyId}
                  onSelectProperty={setSelectedPropertyId}
                  onHoverProperty={setHoveredPropertyId}
                  center={
                    activeCampus?.lat && activeCampus?.lng
                      ? { lat: activeCampus.lat, lng: activeCampus.lng, name: activeCampus.name }
                      : undefined
                  }
                  className="h-[680px]"
                />
              </div>
            </div>
          )}

          {/* Mode 3: Full Map View */}
          {viewMode === "map" && (
            <div className="space-y-4">
              <InteractiveMap
                properties={sortedListings}
                selectedPropertyId={selectedPropertyId}
                hoveredPropertyId={hoveredPropertyId}
                onSelectProperty={setSelectedPropertyId}
                onHoverProperty={setHoveredPropertyId}
                center={
                  activeCampus?.lat && activeCampus?.lng
                    ? { lat: activeCampus.lat, lng: activeCampus.lng, name: activeCampus.name }
                    : undefined
                }
                className="h-[620px]"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
