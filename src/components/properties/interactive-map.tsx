"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BoardingHouseItem } from "@/lib/property-types";
import type { BoardingHouse } from "@/lib/marketplace-types";

export interface MapListingItem {
  id: string;
  name: string;
  address: string;
  barangay?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  rooms?: Array<{
    id?: string;
    monthly_rent: number;
    status?: string;
    room_number?: string;
    room_type?: string;
  }>;
  min_rent?: number;
  amenities?: string[];
  slug?: string | null;
  is_verified?: boolean;
  featured?: boolean;
  distance_meters?: number;
  cover_image_url?: string | null;
}

export type AnyBoardingHouse = BoardingHouse | BoardingHouseItem | MapListingItem;

interface InteractiveMapProps {
  properties: AnyBoardingHouse[];
  selectedPropertyId?: string | null;
  hoveredPropertyId?: string | null;
  onSelectProperty?: (id: string) => void;
  onHoverProperty?: (id: string | null) => void;
  center?: {
    lat: number;
    lng: number;
    name?: string;
  };
  className?: string;
}

// Center Reference: Butuan City Center / FSUU Campus Gate
export const BUTUAN_DEFAULT_CENTER = {
  lat: 8.9482,
  lng: 125.5432,
  name: "University Campus Gate",
};

/**
 * Validates that latitude and longitude are valid finite geographic coordinates.
 * Excludes NaN, infinite, null, undefined, out-of-range, and Null Island (0,0).
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Exclude 0,0 (Null Island) unless explicitly intended
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

export function InteractiveMap({
  properties,
  selectedPropertyId = null,
  hoveredPropertyId = null,
  onSelectProperty,
  onHoverProperty,
  center,
  className = "",
}: InteractiveMapProps) {
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const [dismissedPropertyId, setDismissedPropertyId] = React.useState<string | null>(null);

  // Active center coordinates (defaults to Butuan City / University Campus Gate)
  const effectiveCenter = React.useMemo(() => {
    return {
      lat: center?.lat ?? BUTUAN_DEFAULT_CENTER.lat,
      lng: center?.lng ?? BUTUAN_DEFAULT_CENTER.lng,
      name: center?.name ?? BUTUAN_DEFAULT_CENTER.name,
    };
  }, [center]);

  // Filter properties with strictly valid geographic coordinates to prevent crashes
  const validProperties = React.useMemo(() => {
    return properties.filter((p) => isValidCoordinate(p.latitude, p.longitude));
  }, [properties]);

  const unmappedCount = properties.length - validProperties.length;

  // Selected or hovered property for detail popup card
  const activePropertyId = hoveredPropertyId || selectedPropertyId;
  const activeProperty = React.useMemo(() => {
    if (!activePropertyId || activePropertyId === dismissedPropertyId) return null;
    return properties.find((p) => p.id === activePropertyId) || null;
  }, [properties, activePropertyId, dismissedPropertyId]);

  // Dynamically compute projection span based on valid properties to avoid clipping
  const { latSpan, lngSpan } = React.useMemo(() => {
    if (validProperties.length === 0) {
      return { latSpan: 0.02, lngSpan: 0.02 };
    }
    let maxLatDiff = 0.006;
    let maxLngDiff = 0.006;
    for (const p of validProperties) {
      const lat = p.latitude as number;
      const lng = p.longitude as number;
      const latDiff = Math.abs(lat - effectiveCenter.lat);
      const lngDiff = Math.abs(lng - effectiveCenter.lng);
      if (latDiff > maxLatDiff) maxLatDiff = latDiff;
      if (lngDiff > maxLngDiff) maxLngDiff = lngDiff;
    }
    // Pad by 30% for aesthetic breathing room around pins
    return {
      latSpan: Math.max(0.007, maxLatDiff * 1.3),
      lngSpan: Math.max(0.007, maxLngDiff * 1.3),
    };
  }, [validProperties, effectiveCenter]);

  // Convert GPS Coordinates to 2D SVG canvas percentages relative to the center
  const getCoordinates = (lat?: number | null, lng?: number | null) => {
    if (!isValidCoordinate(lat, lng)) {
      return { x: 50, y: 50 };
    }
    const safeLat = lat as number;
    const safeLng = lng as number;

    const x = 50 + ((safeLng - effectiveCenter.lng) / lngSpan) * 44;
    const y = 50 - ((safeLat - effectiveCenter.lat) / latSpan) * 44;

    return {
      x: Math.max(7, Math.min(93, x)),
      y: Math.max(7, Math.min(93, y)),
    };
  };

  // Calculate approximate geodesic distance in meters (PostGIS ST_Distance simulation)
  const calculateDistance = (lat?: number | null, lng?: number | null) => {
    if (!isValidCoordinate(lat, lng)) return "Nearby";
    const safeLat = lat as number;
    const safeLng = lng as number;

    const dLat = (safeLat - effectiveCenter.lat) * 111320;
    const dLng =
      (safeLng - effectiveCenter.lng) * 111320 * Math.cos(effectiveCenter.lat * (Math.PI / 180));
    const meters = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  // Helper to extract starting rent in PHP
  const getStartingRent = (property: AnyBoardingHouse): number => {
    const raw = property as Partial<BoardingHouse & BoardingHouseItem>;
    if (raw.min_rent && raw.min_rent > 0) return raw.min_rent;
    if (raw.rooms && raw.rooms.length > 0) {
      const rents = raw.rooms.map((r) => r.monthly_rent).filter((r) => r > 0);
      if (rents.length > 0) return Math.min(...rents);
    }
    return 2200;
  };

  const handleSelect = (id: string) => {
    setDismissedPropertyId(null);
    onSelectProperty?.(id);
  };

  return (
    <div
      className={`relative w-full min-h-[420px] sm:min-h-[520px] h-[600px] rounded-2xl border border-slate-800 bg-slate-950/85 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col justify-between ${className}`}
      data-testid="interactive-map-container"
    >
      {/* Map Control Bar Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
          <Navigation className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-white">PostGIS Spatial View</span>
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-300 text-[10px] bg-emerald-500/10"
          >
            EPSG:4326
          </Badge>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline ml-1">
            {validProperties.length} Mapped
            {unmappedCount > 0 && ` (${unmappedCount} no GPS)`}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.6))}
            aria-label="Zoom in"
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.7))}
            aria-label="Zoom out"
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel(1)}
            aria-label="Reset zoom"
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* SVG Geospatial Radar Grid */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <svg
          className="w-full h-full absolute inset-0 select-none transition-transform duration-300 pointer-events-none"
          style={{ transform: `scale(${zoomLevel})` }}
          viewBox="0 0 100 100"
          role="img"
          aria-label="Geospatial boarding house radar map"
        >
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.16)" />
              <stop offset="60%" stopColor="rgba(99, 102, 241, 0.03)" />
              <stop offset="100%" stopColor="rgba(3, 7, 18, 0)" />
            </radialGradient>
            <pattern id="geoGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(51, 65, 85, 0.25)"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100" height="100" fill="url(#geoGrid)" />
          <circle cx="50" cy="50" r="48" fill="url(#radarGlow)" />

          {/* PostGIS Radius Distance Rings (150m, 300m, 450m) */}
          <circle
            cx="50"
            cy="50"
            r="16"
            fill="none"
            stroke="rgba(99, 102, 241, 0.25)"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
          />
          <text
            x="51"
            y="34.5"
            fill="rgba(148, 163, 184, 0.55)"
            fontSize="2"
            fontFamily="monospace"
          >
            150m
          </text>

          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="rgba(99, 102, 241, 0.2)"
            strokeWidth="0.4"
            strokeDasharray="2 2"
          />
          <text
            x="51"
            y="20.5"
            fill="rgba(148, 163, 184, 0.5)"
            fontSize="2"
            fontFamily="monospace"
          >
            300m
          </text>

          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeWidth="0.4"
            strokeDasharray="2.5 2.5"
          />
          <text
            x="51"
            y="6.5"
            fill="rgba(148, 163, 184, 0.45)"
            fontSize="2"
            fontFamily="monospace"
          >
            450m radius
          </text>

          {/* Central Campus Gate Beacon */}
          <circle cx="50" cy="50" r="1.8" fill="#6366f1" className="animate-ping" opacity="0.4" />
          <circle cx="50" cy="50" r="1.4" fill="#a855f7" />
          <circle cx="50" cy="50" r="0.6" fill="#ffffff" />
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="2.2"
            fontWeight="bold"
          >
            University Campus Gate
          </text>

          {/* Property Radius Connections */}
          {validProperties.map((prop) => {
            const { x, y } = getCoordinates(prop.latitude, prop.longitude);
            const isHovered = hoveredPropertyId === prop.id;
            const isSelected = selectedPropertyId === prop.id;

            return (
              <g key={`line-${prop.id}`}>
                {(isHovered || isSelected) && (
                  <line
                    x1="50"
                    y1="50"
                    x2={x}
                    y2={y}
                    stroke="rgba(168, 85, 247, 0.7)"
                    strokeWidth="0.6"
                    strokeDasharray="1 1"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* DOM-based Markers for Interactive Tooltips & Click Handlers */}
        {validProperties.map((property) => {
          const { x, y } = getCoordinates(property.latitude, property.longitude);
          const isSelected = selectedPropertyId === property.id;
          const isHovered = hoveredPropertyId === property.id;
          const availableUnits =
            property.rooms?.filter((r) => r.status === "available").length ?? 0;
          const minRent = getStartingRent(property);

          return (
            <div
              key={property.id}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="absolute z-10 cursor-pointer transition-all duration-200 select-none"
              onMouseEnter={() => onHoverProperty?.(property.id)}
              onMouseLeave={() => onHoverProperty?.(null)}
              onClick={() => handleSelect(property.id)}
              role="button"
              tabIndex={0}
              aria-label={`View ${property.name} on map, ₱${minRent.toLocaleString()}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(property.id);
                }
              }}
            >
              {/* Outer Pulsing Beacon when Active */}
              {(isSelected || isHovered) && (
                <div className="absolute -inset-2.5 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
              )}

              {/* Pin Pill Marker with min 44px touch target */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl border transition-all ${
                  isSelected || isHovered
                    ? "bg-emerald-600 border-emerald-300 text-white scale-110 shadow-emerald-500/50 ring-2 ring-emerald-400/40"
                    : "bg-slate-900/95 border-slate-700/80 text-slate-200 hover:border-slate-500 hover:scale-105"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    availableUnits > 0 ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="font-mono text-[11px]">₱{minRent.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Property Popup Drawer / Card Overlay */}
      {activeProperty && (() => {
        const rawActive = activeProperty as Partial<BoardingHouse & BoardingHouseItem>;
        return (
          <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-auto">
            <div className="rounded-xl border border-indigo-500/40 bg-slate-950/95 backdrop-blur-xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white text-sm truncate">{activeProperty.name}</h3>
                    {rawActive.is_verified && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Verified
                      </Badge>
                    )}
                    {rawActive.featured && (
                      <Badge className="text-[10px] bg-amber-500 text-black font-semibold">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                    {rawActive.barangay
                      ? `Barangay ${rawActive.barangay}, Butuan City`
                      : activeProperty.address}
                  </p>
                </div>

              <div className="flex items-start gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-mono text-emerald-300 block">
                    {calculateDistance(activeProperty.latitude, activeProperty.longitude)} from Gate
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    ₱{getStartingRent(activeProperty).toLocaleString()}/mo min
                  </span>
                </div>
                <button
                  onClick={() => setDismissedPropertyId(activeProperty.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                  aria-label="Close details"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Room Availability Status and Amenities */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">
                  Available Rooms:{" "}
                  <strong className="text-emerald-400 font-mono">
                    {activeProperty.rooms?.filter((r) => r.status === "available").length ?? 0}
                  </strong>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Total Units:{" "}
                  <strong className="text-white">{activeProperty.rooms?.length ?? 0}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeProperty.amenities && (
                  <div className="hidden sm:flex items-center gap-1">
                    {activeProperty.amenities.slice(0, 2).map((a) => (
                      <span
                        key={a}
                        className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/properties/${activeProperty.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-1"
                >
                  View Listing
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    })()}
    </div>
  );
}
