/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4920B',
          light: '#E5A825',
          dark: '#B37A09',
        },
        secondary: {
          DEFAULT: '#0F1B2D',
          light: '#1A2744',
          dark: '#0A1220',
        },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
    },
  },
  plugins: [],
};
