/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#d9e2f1',
          200: '#b3c5e3',
          300: '#7e9bcd',
          400: '#4a6ba8',
          500: '#2e4d87',
          600: '#1f3a6b',
          700: '#16294d',
          800: '#0f1d38',
          900: '#0a1428',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdca8',
          300: '#ffc070',
          400: '#ff9d37',
          500: '#f97b10',
          600: '#e05d05',
          700: '#b84308',
          800: '#93360e',
          900: '#782e0f',
        },
      },
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
