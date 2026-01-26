import { precacheAndRoute } from "workbox-precaching";

// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST, {
  directoryIndex: "index.html",
  cleanURLs: true,
});
