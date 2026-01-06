/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff0000',
        secondary: '#065f46',
        background: '#0f0f0f',
        surface: '#272727',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
      },
      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'SF Pro Text', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};


