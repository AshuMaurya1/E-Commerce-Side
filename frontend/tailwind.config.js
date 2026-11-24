/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        warmwhite: '#FAFAF9',
        emerald: {
          600: '#059669',
          700: '#047857',
        },
        surface: '#F4F4F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
