import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
