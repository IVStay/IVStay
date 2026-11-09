/** @type {import('tailwindcss').Config} */
//
// IvStay design tokens.
// The palette is quiet on purpose: near-black ink, soft greys, white space, and one brand colour
// ("ivy", a deep green) for actions. The older `brand.*` names are kept as aliases so every page
// picks up the new look: brand.slate = ink, brand.gold = ivy.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './partner_frontend/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#222222',
          soft: '#484848',
          muted: '#6A6A6A',
          faint: '#B0B0B0',
        },
        line: {
          DEFAULT: '#DDDDDD',
          soft: '#EBEBEB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F7F7',
        },
        ivy: {
          50: '#EEF6F3',
          100: '#D7EBE4',
          200: '#AFD6C9',
          500: '#2C7A63',
          600: '#1F6B55',
          700: '#185645',
          800: '#124236',
          DEFAULT: '#1F6B55',
        },
        brand: {
          slate: '#222222',
          charcoal: '#484848',
          gold: '#1F6B55',
          goldHover: '#185645',
          goldLight: '#EEF6F3',
          cream: '#FFFFFF',
          warmGray: '#F7F7F7',
          accentGold: '#2C7A63',
        },
      },
      fontFamily: {
        // One family across the site; `font-serif` headings now use it too, for a cleaner look.
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
      boxShadow: {
        glass: '0 6px 16px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 6px 20px rgba(0, 0, 0, 0.10)',
        'gold-glow': '0 1px 2px rgba(0, 0, 0, 0.08)',
        pill: '0 3px 12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        float: '0 6px 20px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
