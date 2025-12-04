import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Define environment variables explicitly for Cloudflare Pages
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
    'import.meta.env.VITE_STRIPE_PRICE_MONTHLY': JSON.stringify(process.env.VITE_STRIPE_PRICE_MONTHLY || ''),
    'import.meta.env.VITE_STRIPE_PRICE_ANNUAL': JSON.stringify(process.env.VITE_STRIPE_PRICE_ANNUAL || ''),
    'import.meta.env.VITE_RESEND_API_KEY': JSON.stringify(process.env.VITE_RESEND_API_KEY || ''),
    'import.meta.env.VITE_FROM_EMAIL': JSON.stringify(process.env.VITE_FROM_EMAIL || ''),
    'import.meta.env.VITE_COINGECKO_API_KEY': JSON.stringify(process.env.VITE_COINGECKO_API_KEY || ''),
    'import.meta.env.VITE_CRYPTOCOMPARE_API_KEY': JSON.stringify(process.env.VITE_CRYPTOCOMPARE_API_KEY || ''),
  },
})
