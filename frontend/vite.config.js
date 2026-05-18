/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El frontend siempre llama a rutas relativas (`/api/...`).
// - En el contenedor de producción: nginx hace proxy_pass /api/ → backend.
// - En `vite dev` desde la host: se proxy a través del contenedor del frontend
//   (que es quien sabe llegar al backend en la red interna del compose).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    watch: { usePolling: true },
    proxy: {
      '/api': {
        target: 'http://localhost:58083',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
});
