import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0D1F3C', light: '#1a3560' },
        teal: { DEFAULT: '#1D9E75', light: '#24c48f', dark: '#167a5a' },
        amber: { DEFAULT: '#EF9F27', light: '#f5b84d' },
        danger: { DEFAULT: '#E24B4A', dark: '#9B1C1C' },
        surface: '#F8F7F4',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      keyframes: {
        pulse_border: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(155,28,28,0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(155,28,28,0)' },
        }
      },
      animation: { pulse_border: 'pulse_border 1.5s ease-in-out infinite' }
    }
  },
  plugins: []
} satisfies Config
