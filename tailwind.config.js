/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00f5d4',
        'neon-pink': '#ff2d78',
      },
    },
  },
  plugins: [],
}
