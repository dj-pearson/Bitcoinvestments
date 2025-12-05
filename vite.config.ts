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
  server: {
    port: 5173,
    strictPort: false,
    https: false, // Explicitly disable HTTPS
    hmr: {
      protocol: 'ws', // Use WebSocket (not wss)
    },
  },
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
    rollupOptions: {
      // Handle missing modules gracefully
      onwarn(warning, warn) {
        // Suppress warnings about missing modules in Web3 packages
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      },
    },
  },
})
