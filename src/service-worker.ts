import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

cleanupOutdatedCaches();

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Handle navigation requests by serving the precached index.html
// This enables the app to work offline when navigating to any route
const handler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

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
