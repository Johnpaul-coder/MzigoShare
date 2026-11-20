/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#15803d',
          light: '#dcfce7',
          amber: '#d97706',
          dark: '#0f172a'
        }
      }
    },
  },
  plugins: [],
};
