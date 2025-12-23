import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import { withSharedConfig } from '@opentuner/config';

export default defineConfig(withSharedConfig({
  plugins: [deno()],
  base: '/admin/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
}));
