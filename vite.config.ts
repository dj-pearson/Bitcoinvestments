import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

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
    ],
  },
  resolve: {
    // Add fallbacks for Node.js modules used by Web3 libraries
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  build: {
    // Increase chunk size warning limit for Web3 libraries
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification settings
    minify: 'terser',
    rollupOptions: {
      // Handle missing modules gracefully
      onwarn(warning, warn) {
        // Suppress warnings about missing modules in Web3 packages
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      },
      output: {
        // Code splitting configuration
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-web3': ['wagmi', 'viem', '@tanstack/react-query'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-supabase': ['@supabase/supabase-js'],
          // Feature chunks
          'feature-auth': [
            './src/contexts/AuthContext.tsx',
            './src/services/auth.ts',
          ],
          'feature-admin': [
            './src/pages/admin/AdminOverview.tsx',
            './src/services/auditLog.ts',
            './src/services/contentModeration.ts',
            './src/services/admin.ts',
          ],
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
