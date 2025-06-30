/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#f9fafb', // Add this to support `bg-background`
        border: '#e5e7eb',     // Already present
        ring: '#93c5fd',       // Already present
      }
    }
  },
  plugins: []
}
