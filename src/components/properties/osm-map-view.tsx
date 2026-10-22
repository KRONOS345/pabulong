"use client";

import * as React from "react";
import { Loader2, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  isValidCoordinate,
  BUTUAN_DEFAULT_CENTER,
  BUTUAN_CAMPUS_LANDMARKS,
  OSM_TILE_CONFIG,
  formatDistance,
  calculateDistanceMeters,
} from "@/lib/osm-maps";
import type { AnyBoardingHouse } from "@/components/properties/interactive-map";
import type { BoardingHouse } from "@/lib/marketplace-types";
import type { BoardingHouseItem } from "@/lib/property-types";
import "leaflet/dist/leaflet.css";

interface OsmMapViewProps {
  properties: AnyBoardingHouse[];
  selectedPropertyId?: string | null;
  hoveredPropertyId?: string | null;
  onSelectProperty?: (id: string) => void;
  center?: { lat: number; lng: number; name?: string };
  zoom?: number;
  className?: string;
  onFallbackRequest?: () => void;
}

export function OsmMapView({
  properties,
  selectedPropertyId,
  hoveredPropertyId,
  onSelectProperty,
  center,
  zoom = 14,
  className = "",
}: OsmMapViewProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<import("leaflet").Map | null>(null);
  const markersLayerRef = React.useRef<import("leaflet").LayerGroup | null>(null);
  const [isClientReady, setIsClientReady] = React.useState(false);

  // Active center coordinates (defaults to Butuan City / University Campus Gate)
  const effectiveCenter = React.useMemo(() => {
    return {
      lat: center?.lat ?? BUTUAN_DEFAULT_CENTER.lat,
      lng: center?.lng ?? BUTUAN_DEFAULT_CENTER.lng,
      name: center?.name ?? BUTUAN_DEFAULT_CENTER.name,
    };
  }, [center]);

  // Valid properties with real geographic coordinates
  const validProperties = React.useMemo(() => {
    return properties.filter((p) => isValidCoordinate(p.latitude, p.longitude));
  }, [properties]);

  // Helper to extract rent in PHP
  const getStartingRent = (property: AnyBoardingHouse): number => {
    const raw = property as Partial<BoardingHouse & BoardingHouseItem>;
    if (raw.min_rent && raw.min_rent > 0) return raw.min_rent;
    if (raw.rooms && raw.rooms.length > 0) {
      const rents = raw.rooms.map((r) => r.monthly_rent).filter((r) => r > 0);
      if (rents.length > 0) return Math.min(...rents);
    }
    return 2200;
  };

  // Initialize Leaflet Map on Client
  React.useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      // Avoid double-initialization
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [effectiveCenter.lat, effectiveCenter.lng],
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Add OpenStreetMap Standard Tiles with required attribution
        L.tileLayer(OSM_TILE_CONFIG.url, {
          attribution: OSM_TILE_CONFIG.attribution,
          maxZoom: OSM_TILE_CONFIG.maxZoom,
          minZoom: OSM_TILE_CONFIG.minZoom,
        }).addTo(map);

        // Add Campus Landmark Markers
        BUTUAN_CAMPUS_LANDMARKS.forEach((campus) => {
          const campusIcon = L.divIcon({
            className: "pabulong-campus-marker",
            html: `
              <div style="background-color: #4f46e5; color: #ffffff; border: 2px solid #ffffff; width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4); font-size: 13px;">
                🎓
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          const marker = L.marker([campus.lat, campus.lng], {
            icon: campusIcon,
            title: campus.name,
            zIndexOffset: 50,
          });

          marker.bindPopup(`
            <div style="font-family: system-ui, sans-serif; padding: 4px 2px; max-width: 220px; color: #0f172a;">
              <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #4338ca;">
                🎓 ${campus.shortName}
              </div>
              <div style="font-size: 11px; color: #475569; margin-top: 3px;">
                ${campus.name}
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                ${campus.address}
              </div>
            </div>
          `);

          marker.addTo(map);
        });

        // Initialize LayerGroup for dynamic property markers
        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;

        setIsClientReady(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [effectiveCenter.lat, effectiveCenter.lng, zoom]);

  // Pan to center if center prop changes
  React.useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([effectiveCenter.lat, effectiveCenter.lng]);
    }
  }, [effectiveCenter.lat, effectiveCenter.lng]);

  // Render Property Markers
  React.useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    let isMounted = true;

    async function updateMarkers() {
      const L = await import("leaflet");
      if (!isMounted || !markersLayerRef.current) return;

      markersLayerRef.current.clearLayers();

      validProperties.forEach((property) => {
        const lat = property.latitude as number;
        const lng = property.longitude as number;
        const isSelected = selectedPropertyId === property.id;
        const isHovered = hoveredPropertyId === property.id;
        const minRent = getStartingRent(property);
        const rentLabel = `₱${(minRent / 1000).toFixed(1)}k`;
        const raw = property as Partial<BoardingHouse & BoardingHouseItem>;
        const dist = calculateDistanceMeters(lat, lng, effectiveCenter.lat, effectiveCenter.lng);

        const activeClass = isSelected || isHovered
          ? "background-color: #059669; border-color: #34d399; color: #ffffff; transform: scale(1.15); box-shadow: 0 0 15px rgba(5, 150, 105, 0.6);"
          : "background-color: #0f172a; border-color: #475569; color: #f8fafc;";

        const iconHtml = `
          <div role="button" aria-label="View ${property.name} on map, ₱${minRent.toLocaleString()}" style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; border-width: 2px; border-style: solid; cursor: pointer; transition: all 0.2s ease; ${activeClass}">
            <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: #34d399;"></div>
            <span>${rentLabel}</span>
          </div>
        `;

        const propertyIcon = L.divIcon({
          className: "pabulong-property-pin",
          html: iconHtml,
          iconSize: [64, 28],
          iconAnchor: [32, 14],
        });

        const marker = L.marker([lat, lng], {
          icon: propertyIcon,
          title: property.name,
          zIndexOffset: isSelected || isHovered ? 1000 : 100,
        });

        marker.on("click", () => {
          onSelectProperty?.(property.id);
        });

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; padding: 4px 2px; max-width: 250px; color: #0f172a;">
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
        `;

        marker.bindPopup(popupContent);
        markersLayerRef.current?.addLayer(marker);

        if (isSelected) {
          marker.openPopup();
        }
      });
    }

    updateMarkers();

    return () => {
      isMounted = false;
    };
  }, [validProperties, selectedPropertyId, hoveredPropertyId, effectiveCenter, onSelectProperty, isClientReady]);

  return (
    <div
      className={`relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 ${className}`}
      data-testid="osm-map-view"
    >
      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
        <Navigation className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">OpenStreetMap</span>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] bg-emerald-500/10">
          Butuan City
        </Badge>
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline ml-1">
          {validProperties.length} Properties
        </span>
      </div>

      {/* Loading Placeholder */}
      {!isClientReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-medium">Loading OpenStreetMap tiles...</p>
          <span className="text-xs text-slate-500 font-mono">Centering on Butuan City</span>
        </div>
      )}

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
