"use client";

import * as React from "react";
import {
  MapPin,
  Crosshair,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidCoordinate,
  BUTUAN_DEFAULT_CENTER,
  findNearestCampus,
  BUTUAN_BARANGAY_COORDS,
} from "@/lib/google-maps";

export { BUTUAN_BARANGAY_COORDS };

interface PropertyLocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  barangay?: string;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  className?: string;
}

export function PropertyLocationPicker({
  latitude,
  longitude,
  barangay = "Libertad",
  onChange,
  className = "",
}: PropertyLocationPickerProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);

  const hasCoords = isValidCoordinate(latitude, longitude);

  // Fallback to barangay reference or Butuan center if unset
  const referenceCoords = BUTUAN_BARANGAY_COORDS[barangay] || BUTUAN_DEFAULT_CENTER;

  const currentLat = hasCoords ? (latitude as number) : referenceCoords.lat;
  const currentLng = hasCoords ? (longitude as number) : referenceCoords.lng;

  const nearestCampus = React.useMemo(() => {
    if (!hasCoords) return null;
    return findNearestCampus(latitude, longitude);
  }, [hasCoords, latitude, longitude]);

  // Set to Barangay Center helper
  const handleSnapToBarangay = () => {
    const coords = BUTUAN_BARANGAY_COORDS[barangay] || BUTUAN_DEFAULT_CENTER;
    onChange({ latitude: coords.lat, longitude: coords.lng });
  };

  // Convert click on interactive SVG radar into lat/lng delta
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width; // 0 to 1
    const yPct = (e.clientY - rect.top) / rect.height; // 0 to 1

    // Map box covers ~0.025 degrees lat and lng around center
    const spanLat = 0.03;
    const spanLng = 0.03;

    const clickedLng = referenceCoords.lng + (xPct - 0.5) * spanLng;
    const clickedLat = referenceCoords.lat - (yPct - 0.5) * spanLat;

    onChange({
      latitude: parseFloat(clickedLat.toFixed(6)),
      longitude: parseFloat(clickedLng.toFixed(6)),
    });
  };

  // Compute marker percentage on visual box
  const markerX = 50 + ((currentLng - referenceCoords.lng) / 0.03) * 100;
  const markerY = 50 - ((currentLat - referenceCoords.lat) / 0.03) * 100;

  const boundedX = Math.max(5, Math.min(95, markerX));
  const boundedY = Math.max(5, Math.min(95, markerY));

  return (
    <div className={`space-y-4 rounded-xl border border-border/80 bg-card p-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <Label className="text-sm font-bold text-foreground">
              Geographic Location (Map Coordinates)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click on the map or enter coordinates to pinpoint your property for student discovery.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSnapToBarangay}
          className="text-xs h-8 rounded-lg shrink-0 gap-1.5"
        >
          <Crosshair className="h-3.5 w-3.5 text-primary" />
          <span>Snap to {barangay} Center</span>
        </Button>
      </div>

      {/* Visual Clickable Map Picker Canvas */}
      <div
        ref={mapRef}
        onClick={handleMapClick}
        className="relative w-full h-[220px] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden cursor-crosshair select-none shadow-inner group"
        title="Click to place pin in Butuan City"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Center crosshair for Barangay reference */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="h-3 w-3 rounded-full border border-indigo-400/40 bg-indigo-500/10 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-indigo-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono absolute top-4 -left-8 whitespace-nowrap">
            {barangay} Reference
          </span>
        </div>

        {/* Placed Pin Marker */}
        {hasCoords && (
          <div
            style={{
              left: `${boundedX}%`,
              top: `${boundedY}%`,
              transform: "translate(-50%, -100%)",
            }}
            className="absolute z-20 pointer-events-none transition-all duration-150"
          >
            <div className="flex flex-col items-center">
              <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg border border-emerald-400/50 whitespace-nowrap">
                Property Pin
              </div>
              <div className="w-0.5 h-2 bg-emerald-400" />
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </div>
        )}

        {/* Click instructions banner */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-slate-800">
          <span>Click anywhere to adjust property pin</span>
          <span className="font-mono text-emerald-400">
            {hasCoords ? `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}` : "No pin placed"}
          </span>
        </div>
      </div>

      {/* Coordinate Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1.5">
          <Label htmlFor="prop-lat" className="text-xs text-muted-foreground">
            Latitude (°N)
          </Label>
          <Input
            id="prop-lat"
            type="number"
            step="0.000001"
            value={latitude ?? ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onChange({ latitude: val, longitude: longitude ?? referenceCoords.lng });
              }
            }}
            placeholder={referenceCoords.lat.toFixed(6)}
            className="font-mono text-xs h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prop-lng" className="text-xs text-muted-foreground">
            Longitude (°E)
          </Label>
          <Input
            id="prop-lng"
            type="number"
            step="0.000001"
            value={longitude ?? ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                onChange({ latitude: latitude ?? referenceCoords.lat, longitude: val });
              }
            }}
            placeholder={referenceCoords.lng.toFixed(6)}
            className="font-mono text-xs h-9"
          />
        </div>
      </div>

      {nearestCampus && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg p-2.5 border border-primary/20">
          <GraduationCap className="h-4 w-4 text-primary shrink-0" />
          <span>
            Pin is approximately <strong>{nearestCampus.distanceFormatted}</strong> from{" "}
            <strong>{nearestCampus.campus.name}</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
