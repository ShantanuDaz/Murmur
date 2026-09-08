import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "logo.svg",
        "icons.svg",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "Murmur - Ephemeral P2P Chat",
        short_name: "Murmur",
        description:
          "Zero-backend, zero-trace, peer-to-peer encrypted chat and video calls.",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        display_override: [
          "window-controls-overlay",
          "standalone",
          "minimal-ui",
        ],
        orientation: "any",
        scope: "/",
        start_url: "/",
        id: "/?source=pwa",
        categories: ["social", "security", "utilities"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Join Room",
            short_name: "Join",
            description:
              "Open Murmur lobby to join or create a secure P2P room",
            url: "/",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            },
            {
              name: "crypto-vendor",
              test: /[\\/]node_modules[\\/](@scure|@noble)[\\/]/,
            },
            {
              name: "p2p-vendor",
              test: /[\\/]node_modules[\\/](trystero|dexie|dexie-react-hooks)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
});
