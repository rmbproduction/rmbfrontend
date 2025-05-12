import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React packages
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }

          // Routing
          if (id.includes('node_modules/react-router') || 
              id.includes('node_modules/react-router-dom') || 
              id.includes('node_modules/@remix-run')) {
            return 'vendor-routing';
          }

          // UI Components
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/framer-motion') || 
              id.includes('node_modules/react-toastify')) {
            return 'vendor-ui';
          }

          // Forms
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/yup')) {
            return 'vendor-forms';
          }

          // Utilities
          if (id.includes('node_modules/axios') || 
              id.includes('node_modules/lodash') || 
              id.includes('node_modules/date-fns')) {
            return 'vendor-utils';
          }
        },
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'es2018',
    // Code splitting optimization
    cssCodeSplit: true,
    // Reduce unused JavaScript
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['lucide-react'],
  },
  // Add preload directives for important resources
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js' && filename.endsWith('.svg')) {
        return { relative: true };
      }
      return { relative: true };
    },
  },
});
