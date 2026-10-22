/**
 * Pabulong — Google Maps Platform Integration & Spatial Utilities
 *
 * Provides safe client-side loading of Google Maps JavaScript API,
 * API key retrieval with validation, graceful degradation fallbacks,
 * and Butuan City localized geographic utilities.
 */

import * as React from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export interface GeoCoordinate {
  lat: number;
  lng: number;
  name?: string;
}

// Butuan City Center / Father Saturnino Urios University (FSUU) Main Campus Gate
export const BUTUAN_DEFAULT_CENTER: GeoCoordinate = {
  lat: 8.9482,
  lng: 125.5432,
  name: "University Campus Gate",
};

// Reference Coordinates for Major Butuan City Barangays
export const BUTUAN_BARANGAY_COORDS: Record<string, { lat: number; lng: number }> = {
  Dagohoy: { lat: 8.9482, lng: 125.5432 },
  Ampayon: { lat: 8.9561, lng: 125.5973 },
  Libertad: { lat: 8.9430, lng: 125.5120 },
  "Villa Kananga": { lat: 8.9390, lng: 125.5280 },
  Doongan: { lat: 8.9510, lng: 125.5520 },
  "San Vicente": { lat: 8.9550, lng: 125.5350 },
  "Baan Riverside": { lat: 8.9580, lng: 125.5480 },
  "Baan Km 3": { lat: 8.9620, lng: 125.5550 },
  Bayanihan: { lat: 8.9495, lng: 125.5390 },
  "Holy Redeemer": { lat: 8.9410, lng: 125.5360 },
  Bancasi: { lat: 8.9500, lng: 125.4800 },
  "Golden Ribbon": { lat: 8.9450, lng: 125.5390 },
  "Ong Yiu": { lat: 8.9420, lng: 125.5410 },
  Pangabugan: { lat: 8.9350, lng: 125.5600 },
  Tungao: { lat: 8.8600, lng: 125.4800 },
};

// Major Butuan City Academic Campuses with Real Coordinates
export const BUTUAN_CAMPUS_LANDMARKS = [
  {
    id: "fsuu_main",
    name: "Father Saturnino Urios University (Main Campus)",
    shortName: "FSUU Main",
    lat: 8.9482,
    lng: 125.5432,
    address: "San Francisco St, Barangay Dagohoy, Butuan City",
  },
  {
    id: "csu_ampayon",
    name: "Caraga State University (CSU Main Campus)",
    shortName: "CSU Ampayon",
    lat: 8.9561,
    lng: 125.5973,
    address: "Ampayon, Butuan City",
  },
  {
    id: "fsuu_morelos",
    name: "FSUU Morelos / Basic Ed Campus",
    shortName: "FSUU Morelos",
    lat: 8.943,
    lng: 125.512,
    address: "Libertad, Butuan City",
  },
  {
    id: "sjit",
    name: "Saint Joseph Institute of Technology",
    shortName: "SJIT",
    lat: 8.9495,
    lng: 125.539,
    address: "Montilla Blvd, Butuan City",
  },
] as const;

/**
 * Validates that latitude and longitude are valid finite geographic coordinates.
 * Excludes NaN, infinite, null, undefined, out-of-range, and Null Island (0,0).
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Exclude Null Island (0,0)
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

/**
 * Retrieves the public Google Maps API key from environment variables.
 * Returns null if missing or set to a placeholder.
 */
export function getGoogleMapsApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || key.trim() === "" || key.includes("YOUR_") || key.includes("placeholder")) {
    return null;
  }
  return key.trim();
}

/**
 * Calculates geodesic distance between two coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats distance in meters into human-readable metric string.
 * Example: 150m or 1.8km.
 */
export function formatDistance(meters?: number | null): string {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) return "Nearby";
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${Math.round(meters)}m`;
}

/**
 * Finds the nearest university campus in Butuan City for a given coordinate.
 */
export function findNearestCampus(
  lat?: number | null,
  lng?: number | null
): { campus: (typeof BUTUAN_CAMPUS_LANDMARKS)[number]; distanceMeters: number; distanceFormatted: string } | null {
  if (!isValidCoordinate(lat, lng)) return null;

  let nearest: (typeof BUTUAN_CAMPUS_LANDMARKS)[number] = BUTUAN_CAMPUS_LANDMARKS[0];
  let minDistance = calculateDistanceMeters(lat as number, lng as number, nearest.lat, nearest.lng);

  for (let i = 1; i < BUTUAN_CAMPUS_LANDMARKS.length; i++) {
    const c = BUTUAN_CAMPUS_LANDMARKS[i];
    const dist = calculateDistanceMeters(lat as number, lng as number, c.lat, c.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = c;
    }
  }

  return {
    campus: nearest,
    distanceMeters: minDistance,
    distanceFormatted: formatDistance(minDistance),
  };
}

// Global promise cache to ensure script tag is inserted only once
let loaderPromise: Promise<typeof google> | null = null;

/**
 * Loads the Google Maps JavaScript API safely on the client.
 */
export async function loadGoogleMaps(apiKey?: string): Promise<typeof google> {
  if (typeof window === "undefined") {
    throw new Error("loadGoogleMaps can only be called in a browser environment");
  }

  if (window.google?.maps) {
    return window.google;
  }

  const key = apiKey || getGoogleMapsApiKey();
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  }

  if (!loaderPromise) {
    loaderPromise = (async () => {
      setOptions({
        key,
        v: "weekly",
      });
      await importLibrary("maps");
      await importLibrary("marker");
      return window.google;
    })();
  }

  return loaderPromise;
}

export type GoogleMapsLoadStatus = "idle" | "loading" | "ready" | "missing-key" | "error";

/**
 * React hook for consuming Google Maps in client components with loading and error states.
 */
export function useGoogleMaps() {
  const [status, setStatus] = React.useState<GoogleMapsLoadStatus>(() => {
    if (typeof window === "undefined") return "idle";
    const key = getGoogleMapsApiKey();
    if (!key) return "missing-key";
    if (window.google?.maps) return "ready";
    return "loading";
  });
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const key = getGoogleMapsApiKey();
    if (!key || window.google?.maps) {
      return;
    }

    let isMounted = true;

    loadGoogleMaps(key)
      .then(() => {
        if (isMounted) {
          setStatus("ready");
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus("error");
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isReady: status === "ready",
    isLoading: status === "loading",
    isMissingKey: status === "missing-key",
    hasError: status === "error",
    status,
    error,
    google: typeof window !== "undefined" ? window.google : undefined,
  };
}
