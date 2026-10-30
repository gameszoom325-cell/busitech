/**
 * Contract2Action AI — Service Worker (sw.js)
 * Implements:
 * 1. Network-First with Cache Fallback for /api/contracts/metadata so contract summaries
 *    remain accessible when backend connectivity is interrupted.
 * 2. Stale-While-Revalidate for static application assets and fonts.
 */

const STATIC_CACHE_NAME = "c2a-static-shell-v2";
const CONTRACT_METADATA_CACHE = "c2a-contract-metadata-v2";

const PRECACHE_URLS = ["/", "/index.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {
        // Non-fatal if an asset is dynamically served by Vite
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE_NAME && key !== CONTRACT_METADATA_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1. Contract Metadata API: Network-First with Service Worker Cache Fallback
  if (url.pathname === "/api/contracts/metadata") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CONTRACT_METADATA_CACHE);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            const body = await cachedResponse.text();
            return new Response(body, {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "X-C2A-Cache": "HIT-SERVICE-WORKER",
              },
            });
          }
          return new Response(
            JSON.stringify({
              error:
                "Backend connection interrupted and no Service Worker cache snapshot was found.",
              offline: true,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })()
    );
    return;
  }

  // Skip Vite internal module runner / HMR requests and other POST/API routes
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 2. Navigation & static assets: Network-First falling back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        return (
          (await cache.match("/index.html")) ||
          (await cache.match("/")) ||
          Response.error()
        );
      })
    );
  }
});

// Listen for explicit CONTRACT_CACHE_SYNC messages from the client app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_CONTRACT_METADATA") {
    const payload = event.data.payload;
    event.waitUntil(
      caches.open(CONTRACT_METADATA_CACHE).then((cache) => {
        const response = new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-C2A-Cache": "CLIENT-SNAPSHOT",
          },
        });
        return cache.put("/api/contracts/metadata", response);
      })
    );
  }
});
