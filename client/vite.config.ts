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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: Exclude React completely from chunking - must stay in main bundle
          // Check for React FIRST and return void to prevent any chunking
          if (
            id.includes('node_modules/react') || 
            id.includes('node_modules/react-dom')
          ) {
            // Return void/undefined explicitly to keep in main bundle
            return;
          }
          
          // React-related libraries can be in a separate chunk
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-chartjs-2') ||
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/qrcode.react') ||
            id.includes('node_modules/react-hot-toast')
          ) {
            return 'react-libs';
          }
          
          // Chart libraries (non-React)
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/recharts')) {
            return 'charts';
          }
          
          // PDF and Excel libraries
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/xlsx') || id.includes('node_modules/papaparse')) {
            return 'export-libs';
          }
          
          // UI libraries
          if (id.includes('node_modules/sweetalert2') || id.includes('node_modules/lucide-react') || id.includes('node_modules/@hello-pangea/dnd')) {
            return 'ui-libs';
          }
          
          // QR Code libraries (non-React)
          if (id.includes('node_modules/qrcode') || id.includes('node_modules/html5-qrcode')) {
            return 'qrcode-libs';
          }
          
          // Form libraries (non-React parts)
          if (id.includes('node_modules/@hookform/resolvers') || id.includes('node_modules/zod')) {
            return 'form-libs';
          }
          
          // Other large vendor libraries (but NOT React - already excluded above)
          if (id.includes('node_modules')) {
            return 'vendor';
          }
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


