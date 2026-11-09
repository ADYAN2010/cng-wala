import { defineConfig } from 'vite';

// Production Vite configuration for Vercel Static Web App deployment
export default defineConfig({
  // Root-relative base path ensuring assets load properly on Vercel preview & production domains
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
});
