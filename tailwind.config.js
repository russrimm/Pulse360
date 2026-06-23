/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: { color: 'inherit', textDecoration: 'none', fontWeight: '500' },
            ...Object.fromEntries(
              ['strong', 'code', 'h1', 'h2', 'h3', 'h4'].map((tag) => [tag, { color: 'inherit' }])
            ),
          },
        },
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 1, backgroundColor: 'rgba(254, 202, 202, 0.7)' },
          '50%': { opacity: 0.5, backgroundColor: 'rgba(239, 68, 68, 0.5)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 