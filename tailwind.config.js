/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfbf7',
          100: '#f9f4e8',
          200: '#f2e5cb',
          300: '#e7d0a3',
          400: '#d7b475',
          500: '#c5a880',
          600: '#b89b6a',
          700: '#997d52',
          800: '#7e6544',
          900: '#67523a',
          950: '#392c1d',
        },
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#0f172a',
          900: '#090d16',
          950: '#05080e',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
