const CACHE_VERSION = "quran-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CURRENT_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE]);

const CORE_URLS = [
  "/",
  "/bookmarks",
  "/notes",
  "/search",
  "/manifest.webmanifest",
  "/offline.html",
  "/apple-touch-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-512x512.png",
];

const DATA_URLS = [
  "/data/index.json",
  "/data/intro.json",
  "/data/notes-index.json",
  "/data/search-index.json",
  "/data/topics.json",
  "/data/topic_content.json",
  "/data/topic_content_map.json",
  ...Array.from({ length: 114 }, (_, index) => `/data/surah/${index + 1}.json`),
  ...Array.from({ length: 521 }, (_, index) => `/data/notes/${index + 1}.json`),
];

const READING_ROUTE_URLS = [
  ...Array.from({ length: 114 }, (_, index) => `/surah/${index + 1}`),
  ...Array.from({ length: 521 }, (_, index) => `/notes/${index + 1}`),
];

const PRECACHE_URLS = [...CORE_URLS, ...READING_ROUTE_URLS, ...DATA_URLS];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        const results = await Promise.allSettled(
          PRECACHE_URLS.map(async (url) => {
            const response = await fetch(url, { cache: "no-cache" });
            if (!response.ok) {
              throw new Error(`Failed to precache ${url}: ${response.status}`);
            }
            await cache.put(url, response);
          }),
        );

        const failure = results.find((result) => result.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      } catch (error) {
        // Do not allow a partially populated release cache to activate and
        // delete the previous release's complete offline cache.
        await caches.delete(STATIC_CACHE);
        throw error;
      }
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("quran-") && !CURRENT_CACHES.has(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (
    url.pathname.startsWith("/data/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match(new URL(request.url).pathname)) || caches.match("/offline.html");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}
