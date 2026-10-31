/**
 * Contract2Action AI — Service Worker (sw.js)
 * Implements:
 * 1. Network-First with Cache Fallback for /api/contracts/metadata so contract summaries
 *    remain accessible when backend connectivity is interrupted.
 * 2. Unregister & clear old caches automatically to ensure instant updates.
 */

const STATIC_CACHE_NAME = "c2a-static-shell-v4";
const CONTRACT_METADATA_CACHE = "c2a-contract-metadata-v4";

const PRECACHE_URLS = ["/", "/index.html", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
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

  // Network-First for everything else
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return (
        (await cache.match(request)) ||
        (await cache.match("/index.html")) ||
        Response.error()
      );
    })
  );
});
