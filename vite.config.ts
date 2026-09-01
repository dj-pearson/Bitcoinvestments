import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for Web3 libraries
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Include specific module polyfills
      include: [
        'buffer',
        'process',
        'util',
        'stream',
        'events',
        'querystring',
        'url',
        'crypto',
      ],
      // Don't polyfill these (causes conflicts)
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    // Exclude problematic Web3 packages from pre-bundling
    exclude: [
      '@reown/appkit',
      '@reown/appkit-scaffold-ui',
      '@reown/appkit-controllers',
    ],
    // Include commonly used packages
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'chart.js',
      'react-chartjs-2',
      'three',
      '@react-three/fiber',
      'buffer',
      'process/browser',
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
  resolve: {
    // Add fallbacks for Node.js modules used by Web3 libraries
    alias: {
      '@': path.resolve(__dirname, './src'),
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
      buffer: 'buffer',
      events: 'events',
      crypto: 'crypto-browserify',
    },
  },
  define: {
    // Define global for Web3 libraries - critical for SIWE
    global: 'globalThis',
  },
  build: {
    // Increase chunk size warning limit for Web3 libraries
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
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto', // This is critical for SIWE/Web3 CommonJS modules
      include: [/node_modules/], // Ensure all CJS in node_modules are handled
    },
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(), // Add rollup polyfill plugin for better Node.js compatibility
      ],
      // Handle missing modules gracefully
      onwarn(warning, warn) {
        // Suppress warnings about missing modules in Web3 packages
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
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

          // Web3 core - wagmi, viem, tanstack query
          if (id.includes('node_modules/wagmi/') ||
              id.includes('node_modules/viem/') ||
              id.includes('node_modules/@tanstack/')) {
            return 'vendor-web3-core';
          }

          // Web3 wallet connectors - RainbowKit, WalletConnect
          if (id.includes('node_modules/@rainbow-me/') ||
              id.includes('node_modules/@walletconnect/') ||
              id.includes('node_modules/@reown/')) {
            return 'vendor-web3-wallets';
          }

          // Ethereum/blockchain utilities
          if (id.includes('node_modules/ethers/') ||
              id.includes('node_modules/siwe/') ||
              id.includes('node_modules/alchemy-sdk/')) {
            return 'vendor-web3-utils';
          }

          // Solana - separate from EVM chains
          if (id.includes('node_modules/@solana/')) {
            return 'vendor-solana';
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
