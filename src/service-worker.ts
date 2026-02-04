import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

cleanupOutdatedCaches();

// Cloudflare Pages uses `/_worker.js/...` as a runtime entrypoint and it is not
// fetchable as a static asset; exclude it from precaching to avoid install
// failures.
// @ts-ignore
const precacheManifest = self.__WB_MANIFEST.filter((entry: any) => {
  const url = typeof entry === "string" ? entry : entry?.url;
  return (
    typeof url === "string" &&
    // Some builds emit `_worker.js/...` (no leading slash) in the manifest.
    !/(^|\/)\_worker\.js(\/|$)/.test(url)
  );
});

precacheAndRoute(precacheManifest, {
  directoryIndex: "index.html",
  cleanURLs: true,
});

// dprint-ignore
registerRoute(({ url }) => url.origin === "https://fonts.googleapis.com", new StaleWhileRevalidate({
  cacheName: "google-fonts-stylesheets",
  plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
}));

// dprint-ignore
registerRoute(({ url }) => url.origin === "https://fonts.gstatic.com", new CacheFirst({
  cacheName: "google-fonts-webfonts",
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
  ],
}));
