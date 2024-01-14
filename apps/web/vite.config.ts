import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy discovery and lineup for easier dev
      '/lineup.json': 'http://127.0.0.1:8000',
      '/discover.json': 'http://127.0.0.1:8000',
      '/epg': 'http://127.0.0.1:8000',
      '/stream': 'http://127.0.0.1:8000',
    },
  },
});
