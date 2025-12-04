import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/asset-app/',
  plugins: [react({
    jsxRuntime: 'automatic',
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'], // Ensure single React instance
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Group React and related libraries together
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Group other large dependencies
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'sweetalert2'],
          'vendor-charts': ['chart.js', 'react-chartjs-2', 'recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB for large apps
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      overlay: true,
      host: 'localhost',
      protocol: 'ws',
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});


