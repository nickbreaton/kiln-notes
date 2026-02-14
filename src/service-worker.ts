import { Duration } from "effect";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";

cleanupOutdatedCaches();

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Server-driven HTML: cache visited pages at runtime.
// Network-first keeps pages fresh; offline falls back to last cached response.
const navigationStrategy = new NetworkFirst({
  cacheName: "pages",
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: Duration.toSeconds("365 days") }),
  ],
});

registerRoute(new NavigationRoute(({ event }) => navigationStrategy.handle({ event, request: event.request })));

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
    new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: Duration.toSeconds("365 days") }),
  ],
}));
