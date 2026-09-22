import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
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
