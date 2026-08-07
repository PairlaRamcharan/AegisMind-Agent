/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#ecfeff',
          100: '#cffaff',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          900: '#164e63',
          950: '#083344',
        },
        cyber: {
          dark: '#090d16',
          card: '#0f172a',
          border: '#1e293b',
          glow: '#38bdf8'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-scan': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))' },
          '100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}
