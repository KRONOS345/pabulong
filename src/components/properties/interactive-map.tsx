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
  Globe,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BoardingHouseItem } from "@/lib/property-types";
import type { BoardingHouse } from "@/lib/marketplace-types";
import { GoogleMapView } from "@/components/properties/google-map-view";
import { OsmMapView } from "@/components/properties/osm-map-view";
import {
  isValidCoordinate,
  BUTUAN_DEFAULT_CENTER,
  getGoogleMapsApiKey,
} from "@/lib/osm-maps";

export { isValidCoordinate, BUTUAN_DEFAULT_CENTER };

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
  preferredEngine?: "osm" | "radar" | "google";
}

export function InteractiveMap({
  properties,
  selectedPropertyId = null,
  hoveredPropertyId = null,
  onSelectProperty,
  onHoverProperty,
  center,
  className = "",
  preferredEngine,
}: InteractiveMapProps) {
  const apiKey = getGoogleMapsApiKey();
  const hasKey = Boolean(apiKey);

  // Engine selection: defaults to cost-conscious OpenStreetMap, with PostGIS radar toggle
  const [engine, setEngine] = React.useState<"osm" | "radar" | "google">(() => {
    if (preferredEngine) return preferredEngine;
    return "osm";
  });

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

        {/* Engine Switcher & Zoom Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Map Engine Toggle: OpenStreetMap vs PostGIS Radar */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-md">
            <Button
              variant={engine === "osm" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEngine("osm")}
              className={`h-7 px-2.5 text-xs font-medium rounded-lg ${
                engine === "osm"
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Switch to OpenStreetMap"
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              OSM
            </Button>
            <Button
              variant={engine === "radar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEngine("radar")}
              className={`h-7 px-2.5 text-xs font-medium rounded-lg ${
                engine === "radar"
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Switch to PostGIS Radar"
            >
              <Radio className="h-3.5 w-3.5 mr-1" />
              Radar
            </Button>
            {hasKey && (
              <Button
                variant={engine === "google" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEngine("google")}
                className={`h-7 px-2 text-xs font-medium rounded-lg ${
                  engine === "google"
                    ? "bg-amber-600 text-white hover:bg-amber-500"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Switch to Google Maps"
              >
                Google
              </Button>
            )}
          </div>

          {/* Radar Zoom Controls (only shown in radar mode) */}
          {engine === "radar" && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-md">
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
          )}
        </div>
      </div>

      {/* Render Active Engine */}
      {engine === "osm" ? (
        <OsmMapView
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          hoveredPropertyId={hoveredPropertyId}
          onSelectProperty={handleSelect}
          center={center}
          className="h-full border-0 rounded-none"
          onFallbackRequest={() => setEngine("radar")}
        />
      ) : engine === "google" && hasKey ? (
        <GoogleMapView
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          hoveredPropertyId={hoveredPropertyId}
          onSelectProperty={handleSelect}
          center={center}
          className="h-full border-0 rounded-none"
          onFallbackRequest={() => setEngine("radar")}
        />
      ) : (
        /* SVG Geospatial Radar Grid (PostGIS Spatial View) */
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

            {/* Background Grid and Radial Gradient */}
            <rect width="100" height="100" fill="url(#geoGrid)" />
            <rect width="100" height="100" fill="url(#radarGlow)" />

            {/* Crosshairs & Axis Grid */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="0.4" strokeDasharray="1 1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="0.4" strokeDasharray="1 1" />

            {/* Concentric Distance Rings (PostGIS ST_DWithin visualization) */}
            <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(52, 211, 153, 0.35)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="0.4" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.4" strokeDasharray="3 3" />

            {/* Distance Ring Metric Labels */}
            <text x="51" y="36.5" fill="rgba(52, 211, 153, 0.7)" fontSize="2.2" fontFamily="monospace" fontWeight="600">
              150m
            </text>
            <text x="51" y="22.5" fill="rgba(99, 102, 241, 0.7)" fontSize="2.2" fontFamily="monospace" fontWeight="600">
              450m
            </text>
            <text x="51" y="8.5" fill="rgba(148, 163, 184, 0.6)" fontSize="2.2" fontFamily="monospace" fontWeight="600">
              900m
            </text>

            {/* Center Reference Marker (Campus Gate) */}
            <g>
              <circle cx="50" cy="50" r="2.2" fill="#4f46e5" stroke="#ffffff" strokeWidth="0.6" />
              <circle cx="50" cy="50" r="4" fill="none" stroke="#6366f1" strokeWidth="0.4" className="animate-ping" style={{ transformOrigin: "50% 50%" }} />
              <text x="50" y="55.5" fill="#a5b4fc" fontSize="2.4" fontFamily="sans-serif" textAnchor="middle" fontWeight="bold">
                {effectiveCenter.name}
              </text>
            </g>

            {/* Geodesic Range Vector lines from Center to Mapped Properties */}
            {validProperties.map((p) => {
              const { x, y } = getCoordinates(p.latitude, p.longitude);
              const isSelected = selectedPropertyId === p.id;
              const isHovered = hoveredPropertyId === p.id;

              return (
                <g key={`vector-${p.id}`}>
                  <line
                    x1="50"
                    y1="50"
                    x2={x}
                    y2={y}
                    stroke={
                      isSelected
                        ? "rgba(52, 211, 153, 0.9)"
                        : isHovered
                        ? "rgba(99, 102, 241, 0.8)"
                        : "rgba(51, 65, 85, 0.35)"
                    }
                    strokeWidth={isSelected || isHovered ? "0.7" : "0.3"}
                    strokeDasharray={isSelected || isHovered ? "none" : "1 1"}
                  />
                  {(isSelected || isHovered) && (
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
      )}

      {/* Selected Property Popup Drawer / Card Overlay (Active in both modes) */}
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
                    <div className="text-base font-extrabold text-emerald-400">
                      ₱{getStartingRent(activeProperty).toLocaleString()}
                      <span className="text-[10px] font-normal text-slate-400">/mo</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 block">
                      {calculateDistance(activeProperty.latitude, activeProperty.longitude)} from Gate
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDismissedPropertyId(activeProperty.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                    aria-label="Dismiss details"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Details Chips */}
              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 border-t border-slate-800">
                <span>
                  Available Rooms:{" "}
                  <strong className="text-white">
                    {activeProperty.rooms?.filter((r) => r.status === "available").length ?? 0}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Rules:{" "}
                  <strong className="text-slate-300">
                    {"rules" in activeProperty && Array.isArray((activeProperty as unknown as { rules?: unknown[] }).rules)
                      ? (activeProperty as unknown as { rules?: unknown[] }).rules?.length ?? 0
                      : 0}
                  </strong>
                </span>
                <span className="ml-auto">
                  <Link
                    href={`/properties/${activeProperty.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    View Listing <ExternalLink className="h-3 w-3" />
                  </Link>
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
