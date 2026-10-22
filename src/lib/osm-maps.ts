/**
 * Pabulong — OpenStreetMap & Spatial Geolocation Utilities
 *
 * Provides OpenStreetMap tile providers, visible attribution compliance,
 * Nominatim reverse geocoding with 1 req/sec rate limiting, in-memory caching,
 * and Butuan City geographic reference coordinates.
 */

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
 * OpenStreetMap Tile Layer Configuration
 * Uses standard OSM tiles or CartoDB voyager/dark tiles with full attribution.
 */
export const OSM_TILE_CONFIG = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  minZoom: 10,
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
  // Exclude Null Island (0,0)
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
}

/**
 * Optional legacy Google Maps key helper for backwards-compatibility.
 * Returns the Google Maps API key only when a real, non-placeholder value is set.
 * Returns null when the key is absent, blank, or a placeholder string.
 * This is the canonical source — google-maps.ts re-uses the same logic.
 */
export function getGoogleMapsApiKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (
    !key ||
    key.trim() === "" ||
    key === "undefined" ||
    key === "null" ||
    key.includes("YOUR_") ||
    key.includes("placeholder")
  ) {
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

// ========================================================================
// NOMINATIM REVERSE GEOCODING (COMPLIANT & RATE-LIMITED)
// ========================================================================

export interface ReverseGeocodeResult {
  displayName: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  barangay?: string;
  city?: string;
  postcode?: string;
  rawAddress?: Record<string, string>;
}

// In-memory cache keyed by 4-decimal-place coordinate hash (~11m resolution)
const geocodeCache = new Map<string, { result: ReverseGeocodeResult; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

let lastNominatimRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // Strictly enforce > 1 req/sec policy

/**
 * Reverse geocodes a geographic coordinate into a human-readable Butuan address
 * using OpenStreetMap's Nominatim service.
 *
 * NOMINATIM POLICY COMPLIANCE:
 * 1. Enforces minimum 1.1s delay between consecutive outgoing requests.
 * 2. Caches responses by coordinate (~11m precision).
 * 3. Identifies application via User-Agent header.
 * 4. Never called continuously during pin dragging.
 * 5. Handles timeouts and network errors gracefully without crashing.
 */
export async function reverseGeocodeCoordinate(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  if (!isValidCoordinate(lat, lng)) {
    return null;
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // Rate-limiting throttle to guarantee <= 1 request/second
  const now = Date.now();
  const timeSinceLastRequest = now - lastNominatimRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastNominatimRequestTime = Date.now();

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lng.toString());
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "PabulongButuanDormPlatform/1.0 (contact@pabulong.app)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Nominatim] Reverse geocode returned HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || !data.address) {
      return null;
    }

    const addr = data.address as Record<string, string>;
    const barangay = addr.suburb || addr.quarter || addr.neighbourhood || addr.village || "";
    const road = addr.road || addr.pedestrian || addr.footway || "";
    const city = addr.city || addr.town || addr.municipality || "Butuan City";

    const result: ReverseGeocodeResult = {
      displayName: data.display_name || "",
      road,
      barangay,
      city,
      postcode: addr.postcode || "8600",
      rawAddress: addr,
    };

    geocodeCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Nominatim] Reverse geocoding failed gracefully: ${msg}`);
    return null;
  }
}
