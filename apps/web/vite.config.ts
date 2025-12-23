import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import { withSharedConfig } from "@opentuner/config";

export default defineConfig(withSharedConfig({
  plugins: [deno()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 1337,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      // Proxy discovery and lineup for easier dev
      "/lineup.json": "http://127.0.0.1:8000",
      "/discover.json": "http://127.0.0.1:8000",
      "/epg": "http://127.0.0.1:8000",
      "/stream": "http://127.0.0.1:8000",
    },
  },
}));
