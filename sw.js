// The deploy workflow replaces this with the UTC time of the deploy, which both
// renames the cache and changes this file, the one thing a browser re-checks.
const VERSION = "__BUILD_TIMESTAMP__";
const PREFIX = "pwa-template-";
const CACHE = PREFIX + VERSION;

// Everything the page asks for from this origin, so nothing is missing with
// no network. The ?v= URLs must be the ones index.html asks for, or the cache
// is never hit.
const SHELL = [
  "./",
  `app.js?v=${VERSION}`,
  "fonts/SpaceGrotesk-VariableFont_wght.woff2",
  "img/apple-touch-icon.png",
  "img/favicon.ico",
  "img/pwa-icon-512x512.png",
  "manifest.json",
  `style.css?v=${VERSION}`,
];

// GitHub Pages serves every file with max-age=600, so a plain fetch of "./" or
// a font can return the previous deploy's copy from the HTTP cache and store
// it next to this deploy's files; no-cache revalidates it with the server.
const fresh = (req) => new Request(req, { cache: "no-cache" });

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL.map(fresh)))
      .then(() => self.skipWaiting()),
  );
});

// Every older deploy's cache goes, then this worker takes over the open pages.
// Caches are shared by the whole origin, so only this app's are touched.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Stores a fetched file under `key`, so a cache emptied by hand or evicted by
 * the browser fills itself again on the next load that has a network.
 */
function keep(e, key, res) {
  if (res.ok) {
    const copy = res.clone();
    e.waitUntil(caches.open(CACHE).then((cache) => cache.put(key, copy)));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // The page names the ?v= of the deploy it belongs to, so it comes from the
  // network whenever there is one; the cached copy is the offline fallback.
  // Another file opened directly is never stored in the page's place.
  if (e.request.mode === "navigate") {
    const isPage = url.pathname === new URL("./", location).pathname;
    e.respondWith(
      fetch(fresh(e.request))
        .then((res) => (isPage ? keep(e, "./", res) : res))
        .catch(() => caches.match("./").then((hit) => hit || Response.error())),
    );
    return;
  }

  // The rest is versioned or precached with this deploy, so a hit is always
  // the right file.
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => keep(e, e.request, res))
          .catch(() => Response.error()),
    ),
  );
});

// A tap on the notification brings the app to the front, or opens it.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients
      .matchAll({ type: "window" })
      .then((windows) => (windows[0] ? windows[0].focus() : self.clients.openWindow("./"))),
  );
});
