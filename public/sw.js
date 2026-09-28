// Pabulong Service Worker - Offline Caching Engine
const CACHE_NAME = "pabulong-offline-v1";
const OFFLINE_URLS = [
  "/",
  "/dashboard",
  "/dashboard/notes",
  "/dashboard/properties",
  "/dashboard/placements",
  "/favicon.ico",
];

// Install Event: Cache Core Offline Routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("Service worker cache pre-fetch warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Purge Stale Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-First with Fallback to Cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip Clerk auth endpoints and external APIs
  if (
    url.hostname.includes("clerk") ||
    url.hostname.includes("supabase") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful GET responses for offline usage
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline): Check Cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return offline dashboard fallback if navigating HTML pages
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/dashboard");
        }

        return new Response("Offline resource unavailable", {
          status: 503,
          statusText: "Service Unavailable Offline",
        });
      })
  );
});
