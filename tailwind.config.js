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
        background: '#f9fafb',  // for bg-background
        foreground: '#111827',  // for text-foreground (you can customize)
        border: '#e5e7eb',
        ring: '#93c5fd',
      }
    }
  },
  plugins: []
}
