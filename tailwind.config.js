/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0a0a0f",
          gray: "#1a1a2e",
          primary: "#8b5cf6",
          secondary: "#f7931a",
          accent: "#06b6d4",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        progress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '50%', marginLeft: '25%' },
          '100%': { width: '0%', marginLeft: '100%' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        progress: 'progress 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
