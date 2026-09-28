"use client";

import * as React from "react";
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type BoardingHouseItem } from "@/lib/property-types";

interface InteractiveMapProps {
  properties: BoardingHouseItem[];
  selectedPropertyId: string | null;
  hoveredPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  onHoverProperty: (id: string | null) => void;
}

// Campus Center Reference Coordinate (PostGIS reference point)
const CAMPUS_REF = {
  lat: 14.6000,
  lng: 120.9835,
  name: "Main University Campus Gate",
};

export function InteractiveMap({
  properties,
  selectedPropertyId,
  hoveredPropertyId,
  onSelectProperty,
  onHoverProperty,
}: InteractiveMapProps) {
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);

  // Selected property for popup card
  const activeProperty = properties.find(
    (p) => p.id === (hoveredPropertyId || selectedPropertyId)
  );

  // Convert GPS Coordinates to 2D SVG canvas percentages relative to Campus Gate
  const getCoordinates = (lat: number, lng: number) => {
    // Normalization range around campus (+/- 0.0050 degrees ~ 500 meters)
    const latSpan = 0.007;
    const lngSpan = 0.007;

    const x = 50 + ((lng - CAMPUS_REF.lng) / lngSpan) * 45;
    const y = 50 - ((lat - CAMPUS_REF.lat) / latSpan) * 45;

    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  // Calculate approximate geodesic distance in meters (PostGIS ST_Distance simulation)
  const calculateDistance = (lat: number, lng: number) => {
    const dLat = (lat - CAMPUS_REF.lat) * 111320;
    const dLng = (lng - CAMPUS_REF.lng) * 111320 * Math.cos(CAMPUS_REF.lat * (Math.PI / 180));
    return Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col justify-between">
      {/* Map Control Bar Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
          <Navigation className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">PostGIS Spatial View</span>
          <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px] bg-indigo-500/10">
            EPSG:4326
          </Badge>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.6))}
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SVG Geospatial Radar Grid */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <svg
          className="w-full h-full absolute inset-0 select-none transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
          viewBox="0 0 100 100"
        >
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.15)" />
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
          <text x="51" y="34.5" fill="rgba(148, 163, 184, 0.5)" fontSize="2" fontFamily="monospace">
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
          <text x="51" y="20.5" fill="rgba(148, 163, 184, 0.5)" fontSize="2" fontFamily="monospace">
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
          <text x="51" y="6.5" fill="rgba(148, 163, 184, 0.5)" fontSize="2" fontFamily="monospace">
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
          {properties.map((prop) => {
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
                    stroke="rgba(168, 85, 247, 0.6)"
                    strokeWidth="0.6"
                    strokeDasharray="1 1"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* DOM-based Markers for Interactive Tooltips & Click Handlers */}
        {properties.map((property) => {
          const { x, y } = getCoordinates(property.latitude, property.longitude);
          const isSelected = selectedPropertyId === property.id;
          const isHovered = hoveredPropertyId === property.id;
          const availableUnits =
            property.rooms?.filter((r) => r.status === "available").length || 0;
          const minRent = property.rooms && property.rooms.length > 0
            ? Math.min(...property.rooms.map((r) => r.monthly_rent))
            : 220;

          return (
            <div
              key={property.id}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className="absolute z-10 cursor-pointer transition-all duration-200"
              onMouseEnter={() => onHoverProperty(property.id)}
              onMouseLeave={() => onHoverProperty(null)}
              onClick={() => onSelectProperty(property.id)}
            >
              {/* Outer Pulsing Beacon when Active */}
              {(isSelected || isHovered) && (
                <div className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-ping pointer-events-none" />
              )}

              {/* Pin Pill Marker */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xl border transition-all ${
                  isSelected || isHovered
                    ? "bg-indigo-600 border-indigo-300 text-white scale-110 shadow-indigo-500/50"
                    : "bg-slate-900/95 border-slate-700/80 text-slate-200 hover:border-slate-500"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    availableUnits > 0 ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="font-mono text-[11px]">${minRent}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Property Popup Drawer / Card Overlay */}
      {activeProperty && (
        <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-auto">
          <div className="rounded-xl border border-indigo-500/40 bg-slate-950/95 backdrop-blur-xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{activeProperty.name}</h3>
                  <Badge variant="success" className="text-[10px]">
                    Verified
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                  {activeProperty.address}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-indigo-300 block">
                  {calculateDistance(activeProperty.latitude, activeProperty.longitude)}m from Gate
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  ${activeProperty.rooms?.[0]?.monthly_rent || 280}/mo avg
                </span>
              </div>
            </div>

            {/* Room Availability Status and Amenities */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-300">
                  Available Rooms:{" "}
                  <strong className="text-emerald-400 font-mono">
                    {activeProperty.rooms?.filter((r) => r.status === "available").length || 0}
                  </strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">
                  Total Units: <strong className="text-white">{activeProperty.rooms?.length || 0}</strong>
                </span>
              </div>

              {activeProperty.amenities && (
                <div className="flex items-center gap-1">
                  {activeProperty.amenities.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
