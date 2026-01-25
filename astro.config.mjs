import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import cloudflare from "@astrojs/cloudflare";
import serviceWorker from "astrojs-service-worker";

export default defineConfig({
  integrations: [
    react(),
    serviceWorker({
      workbox: {
        runtimeCaching: [
          {
            // Everything except API routes
            urlPattern: /^((?!^\/api\/).)*$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "pages",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  output: "static", // Static mode with server-rendered API routes (prerender: false)
  adapter: cloudflare({ imageService: "compile" }),
  vite: {
    plugins: [tailwindcss(), import.meta.env.BASIC_SSL && basicSsl()],
  },
});
