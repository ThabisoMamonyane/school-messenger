/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Morphism color palette
        morph: {
          bg: '#e8eef5',
          bgLight: '#f0f4f8',
          bgDark: '#d1dbe8',
          surface: 'rgba(255, 255, 255, 0.7)',
          surfaceDark: 'rgba(255, 255, 255, 0.5)',
          primary: '#4a90d9',
          primaryLight: '#5ea8f7',
          primaryDark: '#3a7bc8',
          accent: '#6c5ce7',
          success: '#00b894',
          warning: '#fdcb6e',
          danger: '#ff6b6b',
          text: '#2d3748',
          textLight: '#4a5568',
          textMuted: '#718096',
        }
      },
      borderRadius: {
        'morph': '16px',
        'morph-lg': '24px',
        'morph-xl': '32px',
      }
    },
  },
  plugins: [],
}
