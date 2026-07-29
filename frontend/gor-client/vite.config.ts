import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/ws': { target: 'http://localhost:4000', ws: true },
    },
  },
  // Disable base path to prevent Vercel auth redirects
  base: '/',
  // Configure asset path to avoid auth redirects
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      // Ensure proper output configuration for Vercel deployment
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  // Configure for Vercel deployment - disable SSR and ensure proper client-side routing
  ssr: {
    // Disable server-side rendering for better Vercel compatibility
    noExternal: true,
  },
});
