/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
          800: '#1a5c4c',
          900: '#0e3d32',
          950: '#08261f',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        beige: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8decb',
        }
      }
    },
  },
  plugins: [],
};
