import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#0D1F3C', light: '#1a3560', '50': '#EEF2F9' },
        teal:    { DEFAULT: '#E8521A', dark: '#C44415', light: '#F0A88A', '50': '#FEF0E8' },
        amber:   { DEFAULT: '#EF9F27', light: '#f5b84d', '50': '#FEF9EE' },
        danger:  { DEFAULT: '#E24B4A', dark: '#9B1C1C', '50': '#FEF0F0' },
        brand:   { DEFAULT: '#E8521A', light: '#F06432', dark: '#C94115' },
        surface: { DEFAULT: '#F8F7F4', '2': '#F0EEE9' },
        border:  { DEFAULT: '#E4E2DD' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs:    ['12px', '18px'],
        sm:    ['14px', '20px'],
        base:  ['16px', '24px'],
        lg:    ['18px', '28px'],
        xl:    ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '44px'],
      },
      screens: {
        'xs': '375px',
      },
      keyframes: {
        'critical-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(155,28,28,0.6)' },
          '50%':       { boxShadow: '0 0 0 10px rgba(155,28,28,0)' },
        },
      },
      animation: {
        'critical-pulse': 'critical-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
