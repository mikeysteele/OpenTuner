import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import path from 'node:path';
import { withSharedConfig } from '@opentuner/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(withSharedConfig({
  base: '/admin/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@opentuner/ui': path.resolve(__dirname, '../../packages/ui/mod.ts'),
    },
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
