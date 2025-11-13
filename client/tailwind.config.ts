import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#2d3748',
        },
      },
    },
  },
  plugins: [],
} satisfies Config


