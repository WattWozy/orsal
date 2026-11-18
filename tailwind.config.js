/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        steel: {
          50: '#f4f6f8',
          100: '#e3e8ee',
          500: '#5a6b7c',
          800: '#1e293b',
          900: '#0f172a',
        },
        brand: {
          accent: '#d97706', // Ámbar industrial para CTAs
          navy: '#1b2a4a',
        },
      },
    },
  },
  plugins: [],
};