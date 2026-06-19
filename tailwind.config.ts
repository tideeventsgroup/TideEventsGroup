import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#111111', light: '#2a2a2a', '50': '#F2F2F2' },
        teal:    { DEFAULT: '#E8521A', dark: '#C44415', light: '#F0A88A', '50': '#FEF0E8' },
        amber:   { DEFAULT: '#EF9F27', light: '#f5b84d', '50': '#FEF9EE' },
        danger:  { DEFAULT: '#E24B4A', dark: '#9B1C1C', '50': '#FEF0F0' },
        brand:   { DEFAULT: '#E8521A', light: '#F06432', dark: '#C94115' },
        surface: { DEFAULT: '#F5F5F5', '2': '#E8E8E8' },
        border:  { DEFAULT: '#D1D1D1' },
        // Dark palette
        dk: {
          bg:      '#0D0E12',
          surface: '#161820',
          raised:  '#1E2028',
          card:    '#22242E',
          border:  'rgba(255,255,255,0.08)',
          text1:   '#F0F1F5',
          text2:   '#7C7F96',
          text3:   '#52566A',
        },
        sev: {
          critical: '#FF3B30',
          high:     '#FF9500',
          medium:   '#FFCC00',
          low:      '#34C759',
        },
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
        '5xl': ['48px', '56px'],
      },
      screens: { xs: '375px' },
      keyframes: {
        'critical-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,59,48,0.7)' },
          '50%':       { boxShadow: '0 0 0 14px rgba(255,59,48,0)' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.25' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'critical-pulse': 'critical-pulse 1.4s ease-in-out infinite',
        'live-pulse':     'live-pulse 1.6s ease-in-out infinite',
        'slide-up':       'slide-up 0.2s ease-out',
        'fade-in':        'fade-in 0.15s ease-out',
        shimmer:          'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
