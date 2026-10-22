# Pabulong — Google Maps Platform Configuration & Security Guide

This document explains how to set up, secure, and configure the Google Maps Platform for Pabulong in production and development environments.

---

## 1. Google Cloud Platform (GCP) Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Google Cloud Project or create a new project named `pabulong-production`.
3. Link an active **Billing Account** (Google Cloud provides $200 free monthly credit for Maps Platform, sufficient for tens of thousands of monthly map views).

---

## 2. Required APIs to Enable

In the Google Cloud Console, navigate to **APIs & Services > Library**, search for and enable the following APIs:

| API | Purpose | Required |
| :--- | :--- | :---: |
| **Maps JavaScript API** | Interactive vector & raster maps, custom pins, zoom controls, and satellite imagery | **Yes** |
| **Geocoding API** | Converts Butuan City addresses into geographic coordinates | Recommended |
| **Places API (New)** | Campus & landmark autocomplete suggestions | Optional |

---

## 3. Creating & Restricting the API Key

> [!SECURITY]
> Always restrict your API keys! Never use an unrestricted Google Maps API key in a client-facing web application.

1. Navigate to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > API Key**.
3. Name the key: `pabulong-browser-maps-key`.
4. Under **Set application restrictions**, choose **Websites (HTTP referrers)**.
5. Add the following allowed referrers:
   - `https://pabulong-kronos-de39.vercel.app/*`
   - `https://*.vercel.app/*` (for preview deployments)
   - `http://localhost:3000/*` (for local development)
   - `http://127.0.0.1:3000/*`
6. Under **API restrictions**, select **Restrict key**:
   - Check **Maps JavaScript API**
   - Check **Geocoding API** (if enabled)
7. Click **Save**.

---

## 4. Environment Variables

### Local Development (`.env.local`)
Add the public browser key to your `.env.local` file:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYourActualGoogleMapsApiKeyHere123456
```

### Production Deployment (Vercel)
1. Go to your Vercel Project Dashboard:
   [`https://vercel.com/kronos-de39/pabulong/settings/environment-variables`](https://vercel.com/kronos-de39/pabulong/settings/environment-variables)
2. Add a new variable:
   - **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: `AIzaSy...` (your restricted Google Cloud API key)
   - **Environment**: Check **Production**, **Preview**, and **Development**
3. Save and trigger a redeployment.

---

## 5. Graceful Degradation Architecture

Pabulong is built with an offline-resilient architecture:
- **With Google Maps API Key**: Loads live Google Maps JavaScript API with satellite imagery, street tiles, interactive pins, and campus landmarks.
- **Without Key (or API Error)**: The platform gracefully falls back to the built-in **PostGIS Spatial View (EPSG:4326)** with geodesic distance rings, radar vectors, and property pins based on real PostgreSQL coordinates. The UI never crashes or goes blank.
