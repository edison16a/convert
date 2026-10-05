/*
 * Offline support for Convert. Two rules keep it simple and safe:
 *
 * 1. Page loads try the network first and fall back to the cached shell, so
 *    visitors always get the newest version when they are online.
 * 2. Static build output (hashed JS, CSS, fonts, pdf.js helpers) never changes
 *    under the same URL, so it is served from the cache after the first fetch.
 *    Engines the app warms in the background land here too, which is why image,
 *    data and document conversions keep working with no network.
 *
 * The ffmpeg core is not handled here. The app caches it itself with the
 * Cache API, because it is large and only needed for audio and video.
 */
const CACHE = "convert-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];
const IMMUTABLE = [/^\/_next\/static\//, /^\/pdfjs\//, /^\/icons\//, /\.(woff2?|svg|png)$/];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("convert-shell-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/ffmpeg/") || request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (IMMUTABLE.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
