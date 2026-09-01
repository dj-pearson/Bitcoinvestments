import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'chart.js',
      'react-chartjs-2',
      'three',
      '@react-three/fiber',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification settings
    minify: 'terser',
    // **CRITICAL**: COMPLETELY DISABLE modulePreload to prevent ANY preloading
    // This prevents Vite from adding <link rel="modulepreload"> tags which cause
    // modules to be fetched and parsed immediately, triggering SIWE before React mounts
    modulePreload: false,
    // Common.js options to handle problematic packages
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
      output: {
        // Improved code splitting configuration for better performance
        manualChunks: (id) => {
          // Core React bundle - loaded on every page.
          //
          // `use-sync-external-store` must live here. It is a React API shim
          // depended on by several unrelated libraries (zustand via
          // @react-three/fiber, and TipTap among others). Without an explicit
          // home, Rollup folded it into whichever vendor chunk it processed
          // first — vendor-three — which meant every page importing it, /blog
          // included, downloaded 782 kB of Three.js it never used.
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/use-sync-external-store/')) {
            return 'vendor-react';
          }

          // UI libraries - frequently used
          if (id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/framer-motion/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/')) {
            return 'vendor-ui';
          }

          // Charts - only loaded on dashboard/analytics pages
          if (id.includes('node_modules/chart.js/') ||
              id.includes('node_modules/react-chartjs-2/')) {
            return 'vendor-charts';
          }

          // PDF generation - only for tax reports/exports
          if (id.includes('node_modules/jspdf/') ||
              id.includes('node_modules/jspdf-autotable/') ||
              id.includes('node_modules/html2canvas/')) {
            return 'vendor-pdf';
          }

          // Excel/spreadsheet - only for exports
          if (id.includes('node_modules/write-excel-file/') ||
              id.includes('node_modules/fflate/')) {
            return 'vendor-excel';
          }

          // Animation libraries - split from core UI
          if (id.includes('node_modules/gsap/') ||
              id.includes('node_modules/@gsap/')) {
            return 'vendor-animations';
          }

          // Three.js - only for 3D visualizations
          if (id.includes('node_modules/three/') ||
              id.includes('node_modules/@react-three/')) {
            return 'vendor-three';
          }

          // Data fetching - used app-wide by the query client
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }


          // Supabase - database client
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }

          // Sentry - error tracking
          if (id.includes('node_modules/@sentry/')) {
            return 'vendor-monitoring';
          }

          // Stripe - payments
          if (id.includes('node_modules/@stripe/') ||
              id.includes('node_modules/stripe/')) {
            return 'vendor-payments';
          }

          // Markdown rendering
          if (id.includes('node_modules/react-markdown/') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/rehype-')) {
            return 'vendor-markdown';
          }

          // DOMPurify - security
          if (id.includes('node_modules/dompurify/')) {
            return 'vendor-security';
          }

          // Zod - validation (small, can be bundled with utils)
          if (id.includes('node_modules/zod/')) {
            return 'vendor-validation';
          }
        },
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
  },
})
