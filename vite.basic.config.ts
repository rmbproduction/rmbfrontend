import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal configuration for emergency fallback
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable minification for faster builds
    minify: false,
    // Disable sourcemaps
    sourcemap: false,
    // Use smaller chunks
    chunkSizeWarningLimit: 800,
    // Basic output configuration
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
            'framer-motion'
          ]
        }
      }
    }
  },
  // Simple optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
}); 