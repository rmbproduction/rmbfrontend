import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: '/',
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify('https://repairmybike.up.railway.app/api'),
      'process.env.VITE_API_URL': JSON.stringify('https://repairmybike.up.railway.app/api'),
      'process.env.VITE_FRONTEND_URL': JSON.stringify('https://repairmybike.in'),
    },
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
            ui: ['antd', 'framer-motion', 'lucide-react', 'react-toastify'],
            form: ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
            query: ['@tanstack/react-query']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: ['react-toastify'],
      exclude: ['lucide-react'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'https://repairmybike.up.railway.app',
          changeOrigin: true,
          secure: false,
          headers: {
            'Origin': 'https://repairmybike.in',
          },
          rewrite: (path) => path.replace(/^\/api/, ''),
        }
      },
      cors: {
        origin: 'https://repairmybike.in',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
      },
    }
  };
});