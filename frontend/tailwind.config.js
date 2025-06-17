/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#2563eb',
        'medical-green': '#059669',
        'medical-red': '#dc2626',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  
}

