"use client";

import * as React from "react";
import {
  MapPin,
  Crosshair,
  GraduationCap,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidCoordinate,
  BUTUAN_DEFAULT_CENTER,
  findNearestCampus,
  BUTUAN_BARANGAY_COORDS,
  reverseGeocodeCoordinate,
  type ReverseGeocodeResult,
} from "@/lib/osm-maps";

export { BUTUAN_BARANGAY_COORDS };

interface PropertyLocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  barangay?: string;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  onAddressSuggested?: (suggested: { road?: string; barangay?: string; fullAddress?: string }) => void;
  className?: string;
}

export function PropertyLocationPicker({
  latitude,
  longitude,
  barangay = "Libertad",
  onChange,
  onAddressSuggested,
  className = "",
}: PropertyLocationPickerProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);

  const [isGeocoding, setIsGeocoding] = React.useState(false);
  const [geocodeResult, setGeocodeResult] = React.useState<ReverseGeocodeResult | null>(null);
  const [geocodeError, setGeocodeError] = React.useState<string | null>(null);
  const [addressApplied, setAddressApplied] = React.useState(false);

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
    setGeocodeResult(null);
    setGeocodeError(null);
    setAddressApplied(false);
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
    setGeocodeResult(null);
    setGeocodeError(null);
    setAddressApplied(false);
  };

  // Explicit, on-demand OpenStreetMap Nominatim reverse geocoding
  // Complies with Nominatim usage policy: max 1 req/sec, cached, not called during drag
  const handleLookupAddress = async () => {
    if (!hasCoords) return;

    setIsGeocoding(true);
    setGeocodeError(null);
    setAddressApplied(false);

    try {
      const result = await reverseGeocodeCoordinate(currentLat, currentLng);
      if (result) {
        setGeocodeResult(result);
      } else {
        setGeocodeError("OpenStreetMap lookup returned no address or was rate-limited. Coordinates remain saved.");
      }
    } catch {
      setGeocodeError("OpenStreetMap lookup is temporarily busy or rate-limited. Coordinates remain saved.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleApplyAddress = () => {
    if (!geocodeResult) return;
    onAddressSuggested?.({
      road: geocodeResult.road,
      barangay: geocodeResult.barangay,
      fullAddress: geocodeResult.displayName,
    });
    setAddressApplied(true);
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

        <div className="flex items-center gap-2 flex-wrap">
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

          {hasCoords && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isGeocoding}
              onClick={handleLookupAddress}
              className="text-xs h-8 rounded-lg shrink-0 gap-1.5 border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
            >
              {isGeocoding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>Lookup Address (OSM)</span>
            </Button>
          )}
        </div>
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

      {/* Suggested Reverse Geocoding Card */}
      {geocodeResult && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>OpenStreetMap Address Suggestion</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {geocodeResult.road ? `Road: ${geocodeResult.road} • ` : ""}
                {geocodeResult.barangay ? `Barangay: ${geocodeResult.barangay} • ` : ""}
                {geocodeResult.city || "Butuan City"}
              </p>
            </div>

            {onAddressSuggested && (
              <Button
                type="button"
                size="sm"
                variant={addressApplied ? "outline" : "default"}
                onClick={handleApplyAddress}
                className="text-xs h-7 gap-1 shrink-0"
              >
                {addressApplied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span>Applied</span>
                  </>
                ) : (
                  <span>Use Address</span>
                )}
              </Button>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground/80 border-t border-primary/10 pt-1.5 flex items-center justify-between">
            <span>Data © OpenStreetMap contributors, ODbL 1.0 (Nominatim)</span>
            <span className="font-mono text-[10px]">1 req/sec policy compliant</span>
          </div>
        </div>
      )}

      {geocodeError && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{geocodeError}</span>
        </div>
      )}

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
