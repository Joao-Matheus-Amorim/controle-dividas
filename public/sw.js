var CACHE_NAME = "family-finance-v2";
var STATIC_ASSETS = [
  "/offline",
  "/icon.svg",
  "/icon-192x192.png",
  "/icon-384x384.png",
  "/icon-512x512.png",
  "/apple-icon-180x180.png",
];

function isUsable(response) {
  return response && response.ok && response.type !== "opaque";
}

function cacheResponse(request, response) {
  if (request.method !== "GET" || !isUsable(response)) {
    return Promise.resolve();
  }

  var responseToCache = response.clone();
  return caches.open(CACHE_NAME).then(function (cache) { return cache.put(request, responseToCache); });
}

function fetchAndCache(request, fallbackUrl) {
  return fetch(request).then(function (response) {
    if (!isUsable(response)) {
      throw new Error("unusable");
    }
    cacheResponse(request, response).catch(function () {});
    return response;
  }).catch(function () {
    var cacheQuery = fallbackUrl ? caches.match(fallbackUrl) : caches.match(request);
    return cacheQuery;
  });
}

function isAuthenticatedRoute(pathname) {
  return pathname.startsWith("/protected") || pathname.startsWith("/org/") || pathname.startsWith("/auth/") || pathname.startsWith("/login");
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
    }).then(function () {
      return caches.open(CACHE_NAME).then(function (cache) {
        return cache.keys().then(function (requests) {
          return Promise.all(requests.map(function (request) {
            var cachedUrl = new URL(request.url);
            if (isAuthenticatedRoute(cachedUrl.pathname)) {
              return cache.delete(request);
            }
            return Promise.resolve(false);
          }));
        });
      });
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
  // Skip caching for authenticated routes to avoid leaking protected data offline
  if (request.mode === "navigate") {
    if (isAuthenticatedRoute(url.pathname)) {
      event.respondWith(fetch(request).catch(function () { return caches.match("/offline"); }));
      return;
    }
    event.respondWith(
      fetchAndCache(request).then(function (response) {
        if (response) return response;
        return caches.match("/offline");
      }),
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache first, network update
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|ttf|otf|webp|jpg|jpeg)$/)
  ) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        var fetchPromise = fetchAndCache(request).then(function (response) {
          return response || cached;
        });

        return cached || fetchPromise;
      }),
    );
    return;
  }

  // Everything else: network first with cache fallback
  event.respondWith(fetchAndCache(request));
});
