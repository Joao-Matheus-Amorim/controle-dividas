const CACHE_NAME = "family-finance-v1";
const STATIC_ASSETS = [
  "/offline",
  "/icon.svg",
  "/icon-192x192.png",
  "/icon-384x384.png",
  "/icon-512x512.png",
  "/apple-icon-180x180.png",
];

function cacheResponse(request, response) {
  if (request.method !== "GET" || !response || !response.ok) {
    return Promise.resolve();
  }

  const responseToCache = response.clone();
  return caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network only (finance data must be fresh)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: network first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheResponse(request, response).catch(() => undefined);
          return response;
        })
        .catch(() => {
          return caches.match("/offline") || caches.match(request);
        }),
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache first, network update
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|ttf|otf|webp|jpg|jpeg)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            cacheResponse(request, response).catch(() => undefined);
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Everything else: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        cacheResponse(request, response).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
