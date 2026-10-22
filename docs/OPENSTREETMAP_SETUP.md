# Pabulong — OpenStreetMap Architecture, Tile Usage & Geocoding Policy Guide

This document specifies the OpenStreetMap (OSM) map-rendering and reverse-geocoding architecture implemented in Pabulong, including tile provider terms, Nominatim Acceptable Use Policy compliance, attribution rules, and production scaling recommendations.

---

## 1. Architecture Overview

Pabulong uses a zero-cost, open-source geospatial stack designed for high availability and offline resilience:

```
┌────────────────────────────────────────────────────────┐
│               Client-Side Browser Layer                 │
│                                                        │
│  [ OsmMapView ] (Leaflet 1.9.4 Vector & Raster Tiles)  │
│  - Standard OpenStreetMap Tile Layer                  │
│  - Custom SVG/divIcon PHP Rent Markers                │
│  - Academic Campus Landmark Pins                      │
│  - Interactive Detail Popups                          │
│                                                        │
│  [ Offline Radar Fallback ]                            │
│  - PostGIS EPSG:4326 SVG Range Radar                  │
│  - Instant toggle between OSM & Radar                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Reverse Geocoding Layer (Nominatim)        │
│                                                        │
│  - Dedicated client/server utility in `src/lib/osm-maps.ts`
│  - STRICT 1 request / second throttle                  │
│  - In-memory coordinate hash cache (11m resolution)    │
│  - Explicit user-initiated trigger only (NO drag-fire) │
│  - Custom HTTP User-Agent identifier                   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Database / Source of Truth                 │
│                                                        │
│  - Supabase PostgreSQL with PostGIS Geography (Point)  │
│  - Coordinates: EPSG:4326 (WGS 84)                     │
│  - Coordinates are NEVER overwritten by guesses        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Map Tile Provider Terms & Attribution

### Selected Tile Provider: OpenStreetMap Standard Tile Layer
- **Tile URL Template**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **License**: Open Data Commons Open Database License (ODbL) by the OpenStreetMap Foundation (OSMF).
- **Mandatory Attribution**:
  ```html
  &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
  ```
- **Usage Restrictions**:
  1. Standard OSM tile servers are operated on donated volunteer resources.
  2. Heavy bulk downloading or scraping is strictly forbidden.
  3. Caching of tiles in browser HTTP cache must be respected.
  4. Free for standard non-bulk website and mobile discovery.

### Production Scaling / Commercial Alternatives
If Pabulong's traffic grows beyond 50,000 daily map sessions, migrate tile serving to a dedicated commercial or self-hosted tile provider:
- **MapTiler** (free tier includes 100k requests/month, beautiful vector tiles)
- **Stadia Maps** (free tier includes 200k requests/month)
- **Protomaps / Cloudflare R2** (serverless vector tiles hosted directly on Cloudflare R2 / S3 with PMTiles for pennies per month)

---

## 3. Reverse Geocoding: Nominatim Policy Compliance

OpenStreetMap's Nominatim service translates latitude and longitude into street and barangay addresses. Pabulong adheres to the [Nominatim Acceptable Use Policy](https://operations.osmfoundation.org/policies/nominatim/):

| Requirement | Implementation in Pabulong |
| :--- | :--- |
| **Max 1 Request / Second** | `reverseGeocodeCoordinate()` enforces `MIN_REQUEST_INTERVAL_MS = 1100` delay between any two outgoing requests. |
| **No Autocomplete** | Geocoding is never triggered on keystroke or continuous input. |
| **No Drag-Triggering** | Reverse geocoding is NEVER called while a marker or pin is being dragged or moved on canvas. |
| **Explicit User Trigger** | Geocoding only executes when the owner clicks **"Lookup Address (OSM)"**. |
| **User Confirmation** | Detected address is shown as a suggestion; the user must click **"Use Address"** to apply it. The stored PostGIS coordinates remain the source of truth. |
| **Caching** | Results are cached in memory using a 4-decimal coordinate key (~11m radius) with 24-hour expiration. |
| **User-Agent Identification** | HTTP requests send: `User-Agent: PabulongButuanDormPlatform/1.0 (contact@pabulong.app)`. |
| **Attribution Displayed** | Banner displays: `Data © OpenStreetMap contributors, ODbL 1.0 (Nominatim)`. |

### Alternative Geocoding Providers for High Volume
If production demands bulk or automated geocoding:
- **Geoapify** (3,000 free requests/day)
- **LocationIQ** (5,000 free requests/day)
- **Self-hosted Nominatim Docker Container** (unlimited requests, runs on any VPS)

---

## 4. Zero Environment-Variable Dependency

Unlike Google Maps Platform, which required `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, billing account verification, and domain referrer restriction setup in Google Cloud Console:
- OpenStreetMap and Leaflet require **ZERO API keys** to function in development, preview, and production.
- Deploying to Vercel requires no external dashboard API credentials for maps.
- PostGIS coordinates in Supabase continue to power nearest-campus walking distance calculations and spatial indexing (`ST_DWithin`).
