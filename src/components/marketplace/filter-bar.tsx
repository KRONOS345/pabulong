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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={handleSearchChange}
            placeholder="Search by boarding house name, street, or landmark..."
            className="pl-9 pr-9 h-11 text-sm bg-background border-border/80 focus-visible:ring-emerald-500"
            aria-label="Search boarding houses"
          />
          {filters.query && (
            <button
              onClick={() => onChange({ ...filters, query: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
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
                className="h-11 px-4 gap-2 sm:hidden border-border/80 flex items-center justify-center font-medium"
                aria-label="Open filter options"
              />
            }
          >
            <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
            <span>Filters</span>
            {activeCount > 0 && (
              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 ml-1">
                {activeCount}
              </Badge>
            )}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-6">
            <SheetHeader className="text-left pb-4 border-b">
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
                    className="text-xs text-muted-foreground h-8 gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-6 pt-5">
              {/* Campus Proximity in Mobile */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Campus Proximity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUTUAN_CAMPUSES.map((c) => (
                    <Button
                      key={c.id}
                      type="button"
                      variant={filters.campusId === c.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleCampusChange(c.id)}
                      className={`text-xs h-9 justify-start gap-1.5 ${
                        filters.campusId === c.id
                          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold"
                          : ""
                      }`}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      {c.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Barangay Selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Barangay
                </label>
                <Select value={filters.barangay} onValueChange={handleBarangayChange}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Select Barangay">
                      {(val) => formatBarangayLabel(val as string | null)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Barangays</SelectItem>
                    {BUTUAN_BARANGAYS.filter((b) => b !== "all").map((b) => (
                      <SelectItem key={b} value={b}>
                        Barangay {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Restriction */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Gender Policy
                </label>
                <Select value={filters.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Gender policy">
                      {(val) => formatGenderLabel(val as string | null)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Gender (All)</SelectItem>
                    <SelectItem value="coed">Co-ed Only</SelectItem>
                    <SelectItem value="female_only">Female Only</SelectItem>
                    <SelectItem value="male_only">Male Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Room Type */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Room Configuration
                </label>
                <Select value={filters.roomType} onValueChange={handleRoomTypeChange}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Room configuration">
                      {(val) => formatRoomTypeLabel(val as string | null)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types</SelectItem>
                    <SelectItem value="solo">Solo Room</SelectItem>
                    <SelectItem value="shared">Shared Room</SelectItem>
                    <SelectItem value="bedspace">Bedspace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Rent Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Max Monthly Rent
                  </label>
                  <span className="text-sm font-bold text-emerald-400">
                    ₱{filters.maxRent.toLocaleString()} /mo
                  </span>
                </div>
                <Slider
                  value={[filters.maxRent]}
                  onValueChange={handleMaxRentChange}
                  min={1500}
                  max={8000}
                  step={500}
                  className="py-2"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                  <span>₱1,500</span>
                  <span>₱8,000+</span>
                </div>
              </div>

              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters ({totalResults} available)
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Campus Proximity Quick Filter Pills (Desktop & Tablet) */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5" />
          Campus:
        </span>
        {BUTUAN_CAMPUSES.map((c) => {
          const isSelected = filters.campusId === c.id;
          return (
            <Button
              key={c.id}
              type="button"
              variant={isSelected ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleCampusChange(c.id)}
              className={`h-8 text-xs px-3 rounded-full transition-all ${
                isSelected
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </Button>
          );
        })}
      </div>

      {/* Structured Filters Row (Desktop & Tablet) */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-3 pt-1">
        {/* Barangay Select */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            Barangay
          </label>
          <Select value={filters.barangay} onValueChange={handleBarangayChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Barangay">
                {(val) => formatBarangayLabel(val as string | null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Barangays</SelectItem>
              {BUTUAN_BARANGAYS.filter((b) => b !== "all").map((b) => (
                <SelectItem key={b} value={b}>
                  Barangay {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Policy Select */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            Gender Policy
          </label>
          <Select value={filters.gender} onValueChange={handleGenderChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Gender policy">
                {(val) => formatGenderLabel(val as string | null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Gender</SelectItem>
              <SelectItem value="coed">Co-ed Only</SelectItem>
              <SelectItem value="female_only">Female Only</SelectItem>
              <SelectItem value="male_only">Male Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Room Type Select */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            Room Type
          </label>
          <Select value={filters.roomType} onValueChange={handleRoomTypeChange}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Room type">
                {(val) => formatRoomTypeLabel(val as string | null)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="solo">Solo Room</SelectItem>
              <SelectItem value="shared">Shared Room</SelectItem>
              <SelectItem value="bedspace">Bedspace</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Budget Slider */}
        <div className="flex flex-col justify-end">
          <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground mb-1">
            <span>Max Rent</span>
            <span className="font-semibold text-emerald-400">
              ₱{filters.maxRent.toLocaleString()}
            </span>
          </div>
          <div className="h-9 flex items-center px-1">
            <Slider
              value={[filters.maxRent]}
              onValueChange={handleMaxRentChange}
              min={1500}
              max={8000}
              step={500}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Active Filter Pills & Reset Button */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground">Active filters:</span>
            {filters.barangay !== "all" && (
              <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0 h-5">
                {filters.barangay}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleBarangayChange("all")}
                />
              </Badge>
            )}
            {filters.campusId !== "all" && (
              <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0 h-5">
                {BUTUAN_CAMPUSES.find((c) => c.id === filters.campusId)?.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleCampusChange("all")}
                />
              </Badge>
            )}
            {filters.gender !== "all" && (
              <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0 h-5">
                {filters.gender.replace("_", " ")}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleGenderChange("all")}
                />
              </Badge>
            )}
            {filters.roomType !== "all" && (
              <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0 h-5">
                {filters.roomType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRoomTypeChange("all")}
                />
              </Badge>
            )}
            {filters.maxRent < 8000 && (
              <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0 h-5">
                ≤ ₱{filters.maxRent.toLocaleString()}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleMaxRentChange([8000])}
                />
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 text-xs text-muted-foreground hover:text-foreground gap-1 px-2 shrink-0"
          >
            <RotateCcw className="h-3 w-3" />
            Reset all
          </Button>
        </div>
      )}
    </div>
  );
}
