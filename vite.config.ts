import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          ui: ['antd', 'framer-motion', 'lucide-react'],
          form: ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
          query: ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://repairmybike.up.railway.app',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          'repairmybike.up.railway.app': 'localhost'
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    }
  }
});