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
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1e40af', // Navy mining corporate
          600: '#1d4ed8',
          700: '#1e3a8a',
          800: '#172554',
          900: '#0f172a',
        },
        site: {
          gold: '#eab308',
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
