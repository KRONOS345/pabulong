"use client";

import * as React from "react";
import {
  AlertTriangle,
  Loader2,
  Navigation,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useGoogleMaps,
  isValidCoordinate,
  BUTUAN_DEFAULT_CENTER,
  BUTUAN_CAMPUS_LANDMARKS,
  formatDistance,
  calculateDistanceMeters,
} from "@/lib/google-maps";
import type { AnyBoardingHouse } from "@/components/properties/interactive-map";
import type { BoardingHouse } from "@/lib/marketplace-types";
import type { BoardingHouseItem } from "@/lib/property-types";

interface GoogleMapViewProps {
  properties: AnyBoardingHouse[];
  selectedPropertyId?: string | null;
  hoveredPropertyId?: string | null;
  onSelectProperty?: (id: string) => void;
  center?: { lat: number; lng: number; name?: string };
  zoom?: number;
  className?: string;
  onFallbackRequest?: () => void;
}

export function GoogleMapView({
  properties,
  selectedPropertyId,
  hoveredPropertyId,
  onSelectProperty,
  center,
  zoom = 14,
  className = "",
  onFallbackRequest,
}: GoogleMapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<Map<string, google.maps.Marker>>(new Map());
  const campusMarkersRef = React.useRef<google.maps.Marker[]>([]);
  const infoWindowRef = React.useRef<google.maps.InfoWindow | null>(null);

  const { isReady, isLoading, isMissingKey, hasError, error } = useGoogleMaps();

  // Active center coordinates (defaults to Butuan City / University Campus Gate)
  const effectiveCenter = React.useMemo(() => {
    return {
      lat: center?.lat ?? BUTUAN_DEFAULT_CENTER.lat,
      lng: center?.lng ?? BUTUAN_DEFAULT_CENTER.lng,
      name: center?.name ?? BUTUAN_DEFAULT_CENTER.name,
    };
  }, [center]);

  // Valid properties with real coordinates
  const validProperties = React.useMemo(() => {
    return properties.filter((p) => isValidCoordinate(p.latitude, p.longitude));
  }, [properties]);

  // Helper to extract rent
  const getStartingRent = (property: AnyBoardingHouse): number => {
    const raw = property as Partial<BoardingHouse & BoardingHouseItem>;
    if (raw.min_rent && raw.min_rent > 0) return raw.min_rent;
    if (raw.rooms && raw.rooms.length > 0) {
      const rents = raw.rooms.map((r) => r.monthly_rent).filter((r) => r > 0);
      if (rents.length > 0) return Math.min(...rents);
    }
    return 2200;
  };

  // Initialize Map when Google Maps API is loaded
  React.useEffect(() => {
    if (!isReady || !mapContainerRef.current || !window.google?.maps) return;

    // Prevent re-creating map if container already has map instance
    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: effectiveCenter.lat, lng: effectiveCenter.lng },
        zoom,
        mapTypeId: "roadmap",
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        styles: [
          {
            featureType: "poi.school",
            elementType: "geometry",
            stylers: [{ color: "#dbeafe" }],
          },
          {
            featureType: "poi.school",
            elementType: "labels.icon",
            stylers: [{ visibility: "on" }],
          },
        ],
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;
    }
  }, [isReady, effectiveCenter.lat, effectiveCenter.lng, zoom]);

  // Pan map if center prop changes
  React.useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: effectiveCenter.lat,
        lng: effectiveCenter.lng,
      });
    }
  }, [effectiveCenter.lat, effectiveCenter.lng]);

  // Render campus landmark markers
  React.useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear previous campus markers
    campusMarkersRef.current.forEach((m) => m.setMap(null));
    campusMarkersRef.current = [];

    const map = mapInstanceRef.current;

    BUTUAN_CAMPUS_LANDMARKS.forEach((campus) => {
      const marker = new window.google.maps.Marker({
        position: { lat: campus.lat, lng: campus.lng },
        map,
        title: campus.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#4f46e5", // Indigo
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
        zIndex: 5,
      });

      marker.addListener("click", () => {
        if (!infoWindowRef.current) return;
        infoWindowRef.current.setContent(`
          <div style="font-family: system-ui, sans-serif; padding: 6px 8px; max-width: 240px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #1e1b4b;">
              🎓 ${campus.shortName}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              ${campus.name}
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">
              ${campus.address}
            </div>
          </div>
        `);
        infoWindowRef.current.open(map, marker);
      });

      campusMarkersRef.current.push(marker);
    });

    return () => {
      campusMarkersRef.current.forEach((m) => m.setMap(null));
      campusMarkersRef.current = [];
    };
  }, [isReady]);

  // Render property markers
  React.useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;
    const existingMarkers = markersRef.current;

    // Remove markers that are no longer in validProperties
    const currentIds = new Set(validProperties.map((p) => p.id));
    existingMarkers.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        existingMarkers.delete(id);
      }
    });

    // Add or update markers
    validProperties.forEach((property) => {
      const lat = property.latitude as number;
      const lng = property.longitude as number;
      const isSelected = selectedPropertyId === property.id;
      const isHovered = hoveredPropertyId === property.id;
      const minRent = getStartingRent(property);

      let marker = existingMarkers.get(property.id);

      if (!marker) {
        marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: property.name,
          label: {
            text: `₱${(minRent / 1000).toFixed(1)}k`,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "bold",
          },
          icon: {
            path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 Z",
            scale: 1.1,
            fillColor: isSelected || isHovered ? "#059669" : "#0f172a",
            fillOpacity: 0.95,
            strokeColor: isSelected || isHovered ? "#34d399" : "#475569",
            strokeWeight: 2,
            labelOrigin: new window.google.maps.Point(0, -30),
          },
          zIndex: isSelected || isHovered ? 100 : 10,
        });

        marker.addListener("click", () => {
          onSelectProperty?.(property.id);

          if (infoWindowRef.current) {
            const raw = property as Partial<BoardingHouse & BoardingHouseItem>;
            const dist = calculateDistanceMeters(lat, lng, effectiveCenter.lat, effectiveCenter.lng);
            infoWindowRef.current.setContent(`
              <div style="font-family: system-ui, sans-serif; padding: 6px 8px; max-width: 260px;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">
                  ${property.name}
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                  Barangay ${raw.barangay || "Butuan City"} • ${formatDistance(dist)} from gate
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #059669; margin-top: 6px;">
                  ₱${minRent.toLocaleString()}<span style="font-weight: 400; font-size: 10px; color: #64748b;"> /month</span>
                </div>
                <div style="margin-top: 8px;">
                  <a href="/properties/${property.id}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                    View Details →
                  </a>
                </div>
              </div>
            `);
            infoWindowRef.current.open(map, marker);
          }
        });

        existingMarkers.set(property.id, marker);
      } else {
        // Update marker state
        marker.setPosition({ lat, lng });
        marker.setZIndex(isSelected || isHovered ? 100 : 10);
        marker.setIcon({
          path: "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 Z",
          scale: isSelected || isHovered ? 1.25 : 1.1,
          fillColor: isSelected || isHovered ? "#059669" : "#0f172a",
          fillOpacity: 0.95,
          strokeColor: isSelected || isHovered ? "#34d399" : "#475569",
          strokeWeight: isSelected || isHovered ? 2.5 : 2,
          labelOrigin: new window.google.maps.Point(0, -30),
        });
      }
    });
  }, [validProperties, selectedPropertyId, hoveredPropertyId, effectiveCenter, onSelectProperty, isReady]);

  // Loading State
  if (isLoading) {
    return (
      <div className={`relative w-full h-[600px] rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center gap-3 ${className}`}>
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Loading Google Maps Platform...</p>
        <span className="text-xs text-slate-500 font-mono">Initializing Butuan City spatial coordinates</span>
      </div>
    );
  }

  // Missing API Key or Error State: Graceful fallback
  if (isMissingKey || hasError) {
    return (
      <div className={`relative w-full h-[600px] rounded-2xl border border-amber-900/50 bg-slate-950 p-6 flex flex-col justify-between ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h3 className="font-bold text-sm text-white">
              {isMissingKey ? "Google Maps API Key Not Configured" : "Google Maps Loading Error"}
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {isMissingKey
              ? "To display live satellite imagery and official Google Maps street tiles, provide NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment configuration."
              : `The Google Maps JavaScript API encountered an error: ${error?.message || "Check domain restrictions and billing status in Google Cloud Console."}`}
          </p>

          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
              High-Precision PostGIS Spatial Mode Available
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pabulong includes a built-in PostGIS EPSG:4326 spatial radar map that operates offline without third-party API dependencies.
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {validProperties.length} verified Butuan properties mapped
          </span>
          {onFallbackRequest && (
            <Button
              size="sm"
              onClick={onFallbackRequest}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl"
            >
              Switch to PostGIS Radar View →
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className}`}>
      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
        <Navigation className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">Google Maps Live</span>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] bg-emerald-500/10">
          Butuan City
        </Badge>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline ml-1">
          {validProperties.length} Properties
        </span>
      </div>

      {/* Google Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
