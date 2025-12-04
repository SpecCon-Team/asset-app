import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/asset-app/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and React DOM - must be in the same chunk and loaded first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react/jsx-runtime')) {
            return 'react-vendor';
          }
          
          // React Router - depends on React, so keep separate but ensure React loads first
          if (id.includes('node_modules/react-router')) {
            return 'react-router-vendor';
          }
          
          // Chart libraries
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2') || id.includes('node_modules/recharts')) {
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
          
          // QR Code libraries
          if (id.includes('node_modules/qrcode') || id.includes('node_modules/html5-qrcode')) {
            return 'qrcode-libs';
          }
          
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform/resolvers') || id.includes('node_modules/zod')) {
            return 'form-libs';
          }
          
          // Other large vendor libraries
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


