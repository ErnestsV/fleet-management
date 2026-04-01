import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        mist: '#f3f4f6',
        brand: {
          50: '#eefbf5',
          100: '#d4f5e3',
          500: '#1f8f63',
          600: '#167552',
          700: '#125e43',
        },
        accent: {
          amber: '#f59e0b',
          red: '#ef4444',
          blue: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        panel: '0 20px 50px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
