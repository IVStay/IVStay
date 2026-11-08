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
          slate: "#0F172A",
          charcoal: "#1E293B",
          gold: "#D97706",
          goldHover: "#B45309",
          goldLight: "#FEF3C7",
          cream: "#FAFAF9",
          warmGray: "#F3F4F6",
          accentGold: "#F59E0B"
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'card-hover': '0 20px 30px -10px rgba(15, 23, 42, 0.12)',
        'gold-glow': '0 4px 20px -2px rgba(217, 119, 6, 0.3)',
      }
    },
  },
  plugins: [],
}
