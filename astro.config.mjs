import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import cloudflare from "@astrojs/cloudflare";
import AstroPWA from "@vite-pwa/astro";

export default defineConfig({
  integrations: [
    AstroPWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
    }),
    react(),
  ],
  output: "static", // Static mode with server-rendered API routes (prerender: false)
  adapter: cloudflare({ imageService: "compile" }),
  vite: {
    plugins: [tailwindcss(), import.meta.env.BASIC_SSL && basicSsl()].filter(
      Boolean,
    ),
  },
});
