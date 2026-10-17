"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { GenderRestriction, RoomType } from "@/lib/marketplace-types";

// Supported Butuan Landmarks & Campuses with Coordinates
export const BUTUAN_CAMPUSES = [
  { id: "all", name: "All Butuan", lat: undefined, lng: undefined },
  { id: "csu", name: "CSU Ampayon", lat: 8.9561, lng: 125.5973, label: "Near CSU Main" },
  { id: "fsuu", name: "FSUU Downtown", lat: 8.9482, lng: 125.5432, label: "Near FSUU Main" },
  { id: "morelos", name: "FSUU Morelos / Libertad", lat: 8.9430, lng: 125.5120, label: "Near FSUU Morelos" },
];

export const BUTUAN_BARANGAYS = [
  "all",
  "Dagohoy",
  "Ampayon",
  "Libertad",
  "Villa Kananga",
  "Doongan",
  "San Vicente",
  "Bayanihan",
  "Holy Redeemer",
];

export interface MarketplaceFilters {
  query: string;
  barangay: string;
  campusId: string;
  gender: GenderRestriction | "all";
  roomType: RoomType | "all";
  maxRent: number;
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  query: "",
  barangay: "all",
  campusId: "all",
  gender: "all",
  roomType: "all",
  maxRent: 8000,
};

interface FilterBarProps {
  filters: MarketplaceFilters;
  onChange: (filters: MarketplaceFilters) => void;
  onReset: () => void;
  totalResults: number;
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  totalResults,
}: FilterBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  // Calculate active filter count (excluding defaults)
  const activeCount = React.useMemo(() => {
    let count = 0;
    if (filters.query.trim()) count++;
    if (filters.barangay !== "all") count++;
    if (filters.campusId !== "all") count++;
    if (filters.gender !== "all") count++;
    if (filters.roomType !== "all") count++;
    if (filters.maxRent < 8000) count++;
    return count;
  }, [filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, query: e.target.value });
  };

  const handleBarangayChange = (val: string | null) => {
    if (val) onChange({ ...filters, barangay: val });
  };

  const handleCampusChange = (campusId: string) => {
    onChange({ ...filters, campusId });
  };

  const handleGenderChange = (val: string | null) => {
    if (val) onChange({ ...filters, gender: val as GenderRestriction | "all" });
  };

  const handleRoomTypeChange = (val: string | null) => {
    if (val) onChange({ ...filters, roomType: val as RoomType | "all" });
  };

  const handleMaxRentChange = (vals: number | readonly number[]) => {
    const num = Array.isArray(vals) ? vals[0] : typeof vals === "number" ? vals : 8000;
    onChange({ ...filters, maxRent: num });
  };

  const formatBarangayLabel = (val: string | null) => {
    if (!val || val === "all") return "All Barangays";
    return `Barangay ${val}`;
  };

  const formatGenderLabel = (val: string | null) => {
    switch (val) {
      case "coed":
        return "Co-ed Only";
      case "female_only":
        return "Female Only";
      case "male_only":
        return "Male Only";
      default:
        return "Any Gender";
    }
  };

  const formatRoomTypeLabel = (val: string | null) => {
    switch (val) {
      case "solo":
        return "Solo Room";
      case "shared":
        return "Shared Room";
      case "bedspace":
        return "Bedspace";
      default:
        return "All Room Types";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Search Input & Action Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={handleSearchChange}
            placeholder="Search by boarding house name, street, or landmark in Butuan..."
            className="pl-10 pr-10 h-11 text-sm bg-background/90 border-border/80 focus-visible:ring-primary/60 rounded-xl"
            aria-label="Search boarding houses"
          />
          {filters.query && (
            <button
              onClick={() => onChange({ ...filters, query: "" })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Sheet Trigger */}
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="h-11 px-4 gap-2 sm:hidden border-border/80 flex items-center justify-center font-medium rounded-xl"
                aria-label="Open filter options"
              />
            }
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span>Filters</span>
            {activeCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 ml-1">
                {activeCount}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-6 bg-card">
            <SheetHeader className="text-left pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-bold">Filter Listings</SheetTitle>
                {activeCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onReset();
                      setMobileFilterOpen(false);
                    }}
                    className="h-8 text-xs text-muted-foreground gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Campus Proximity in Mobile */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Campus Proximity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUTUAN_CAMPUSES.map((campus) => {
                    const isSelected = filters.campusId === campus.id;
                    return (
                      <Button
                        key={campus.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleCampusChange(campus.id)}
                        className={`h-9 text-xs justify-start ${
                          isSelected ? "bg-primary text-primary-foreground font-semibold" : "border-border/80 text-muted-foreground"
                        }`}
                      >
                        {campus.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Barangay Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Barangay in Butuan
                </label>
                <Select value={filters.barangay} onValueChange={handleBarangayChange}>
                  <SelectTrigger className="w-full h-10 bg-background text-xs">
                    <SelectValue>{(val) => formatBarangayLabel(val as string)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {BUTUAN_BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b === "all" ? "All Barangays" : `Barangay ${b}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Policy */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Gender Restriction
                </label>
                <Select value={filters.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="w-full h-10 bg-background text-xs">
                    <SelectValue>{(val) => formatGenderLabel(val as string)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Gender Policy</SelectItem>
                    <SelectItem value="coed">Co-ed Only</SelectItem>
                    <SelectItem value="female_only">Female Only</SelectItem>
                    <SelectItem value="male_only">Male Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Room Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Room Configuration
                </label>
                <Select value={filters.roomType} onValueChange={handleRoomTypeChange}>
                  <SelectTrigger className="w-full h-10 bg-background text-xs">
                    <SelectValue>{(val) => formatRoomTypeLabel(val as string)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types</SelectItem>
                    <SelectItem value="solo">Solo Room (1 Pax)</SelectItem>
                    <SelectItem value="shared">Shared Room (2-4 Pax)</SelectItem>
                    <SelectItem value="bedspace">Bedspace (Shared Dorm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Rent Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="uppercase text-muted-foreground tracking-wider">Max Monthly Budget</span>
                  <span className="text-primary font-bold">
                    {filters.maxRent >= 8000 ? "No Max Limit (₱8,000+)" : `Up to ₱${filters.maxRent.toLocaleString()}/mo`}
                  </span>
                </div>
                <Slider
                  min={1000}
                  max={8000}
                  step={250}
                  value={filters.maxRent}
                  onValueChange={handleMaxRentChange}
                />
              </div>

              <Button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-medium mt-4 rounded-xl"
              >
                Apply Filters ({totalResults} matches)
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Campus Proximity Quick Filter Bar (Desktop) */}
      <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-muted-foreground shrink-0 font-medium flex items-center gap-1.5 pr-1">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          Campuses:
        </span>
        {BUTUAN_CAMPUSES.map((campus) => {
          const isSelected = filters.campusId === campus.id;
          return (
            <Button
              key={campus.id}
              type="button"
              variant={isSelected ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleCampusChange(campus.id)}
              className={`h-8 text-xs shrink-0 rounded-lg transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {campus.name}
            </Button>
          );
        })}
      </div>

      {/* Desktop Filter Controls Row (Barangay, Gender, Room Type, Price Slider) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Barangay Selector */}
        <Select value={filters.barangay} onValueChange={handleBarangayChange}>
          <SelectTrigger className="h-9 text-xs bg-background/90 border-border/80 rounded-lg">
            <SelectValue>{(val) => formatBarangayLabel(val as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BUTUAN_BARANGAYS.map((b) => (
              <SelectItem key={b} value={b}>
                {b === "all" ? "All Barangays" : `Barangay ${b}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Gender Policy */}
        <Select value={filters.gender} onValueChange={handleGenderChange}>
          <SelectTrigger className="h-9 text-xs bg-background/90 border-border/80 rounded-lg">
            <SelectValue>{(val) => formatGenderLabel(val as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Gender Policy</SelectItem>
            <SelectItem value="coed">Co-ed Only</SelectItem>
            <SelectItem value="female_only">Female Only</SelectItem>
            <SelectItem value="male_only">Male Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Room Type */}
        <Select value={filters.roomType} onValueChange={handleRoomTypeChange}>
          <SelectTrigger className="h-9 text-xs bg-background/90 border-border/80 rounded-lg">
            <SelectValue>{(val) => formatRoomTypeLabel(val as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Room Types</SelectItem>
            <SelectItem value="solo">Solo Room (1 Pax)</SelectItem>
            <SelectItem value="shared">Shared Room (2-4 Pax)</SelectItem>
            <SelectItem value="bedspace">Bedspace (Shared Dorm)</SelectItem>
          </SelectContent>
        </Select>

        {/* Price Slider Box */}
        <div className="flex flex-col justify-center px-3 py-1.5 rounded-lg border border-border/80 bg-background/90 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Max Rent:</span>
            <span className="font-bold text-primary">
              {filters.maxRent >= 8000 ? "Any Budget" : `₱${filters.maxRent.toLocaleString()}`}
            </span>
          </div>
          <Slider
            min={1000}
            max={8000}
            step={250}
            value={filters.maxRent}
            onValueChange={handleMaxRentChange}
            className="py-1"
          />
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium">Active filters:</span>
          {filters.query && (
            <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
              Keyword: &ldquo;{filters.query}&rdquo;
              <button
                onClick={() => onChange({ ...filters, query: "" })}
                className="hover:text-foreground ml-0.5"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.campusId !== "all" && (
            <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
              Campus: {BUTUAN_CAMPUSES.find((c) => c.id === filters.campusId)?.name}
              <button
                onClick={() => handleCampusChange("all")}
                className="hover:text-foreground ml-0.5"
                aria-label="Remove campus filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.barangay !== "all" && (
            <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
              Barangay {filters.barangay}
              <button
                onClick={() => handleBarangayChange("all")}
                className="hover:text-foreground ml-0.5"
                aria-label="Remove barangay filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.gender !== "all" && (
            <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
              {formatGenderLabel(filters.gender)}
              <button
                onClick={() => handleGenderChange("all")}
                className="hover:text-foreground ml-0.5"
                aria-label="Remove gender filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.roomType !== "all" && (
            <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
              {formatRoomTypeLabel(filters.roomType)}
              <button
                onClick={() => handleRoomTypeChange("all")}
                className="hover:text-foreground ml-0.5"
                aria-label="Remove room type filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.maxRent < 8000 && (
            <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
              Budget ≤ ₱{filters.maxRent.toLocaleString()}
              <button
                onClick={() => onChange({ ...filters, maxRent: 8000 })}
                className="hover:text-foreground ml-0.5"
                aria-label="Remove rent filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground ml-auto"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
