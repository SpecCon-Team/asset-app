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
          // React and React DOM - must be in the same chunk and loaded first
          // Include all React-related packages to ensure they load together
          if (
            id.includes('node_modules/react/') || 
            id.includes('node_modules/react-dom/') || 
            id.includes('node_modules/react/jsx-runtime') ||
            id.includes('node_modules/react/index') ||
            id.includes('node_modules/react/cjs/') ||
            id.includes('node_modules/react-dom/index') ||
            id.includes('node_modules/react-dom/cjs/')
          ) {
            return 'react-vendor';
          }
          
          // All React-related libraries must be in react-vendor to ensure React is available
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-chartjs-2') ||
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/qrcode.react') ||
            id.includes('node_modules/react-hot-toast')
          ) {
            return 'react-vendor';
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
          
          // Other large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure react-vendor chunk loads first
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'react-vendor') {
            return 'assets/react-vendor-[hash].js';
          }
          return 'assets/[name]-[hash].js';
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


