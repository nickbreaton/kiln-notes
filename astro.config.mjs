import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import AstroPWA from "@vite-pwa/astro";

export default defineConfig({
  integrations: [
    // https://vite-pwa-org.netlify.app/guide/inject-manifest
    AstroPWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
    react(),
  ],
  output: "static", // Static mode with server-rendered API routes (prerender: false)
  adapter: cloudflare({ imageService: "compile" }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [".loca.lt"],
    },
  },
});
