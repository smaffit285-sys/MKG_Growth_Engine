/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'neon-cyan': '#00f5d4',
        'neon-pink': '#ff2d78',
        orange: {
          300: '#9cecff',
          400: '#56dffc',
          500: '#ff4fa3',
          600: '#df3e8c',
          700: '#b42d70',
          800: '#812154',
          900: '#551839',
          950: '#2f0b20',
        },
      },
    },
  },
  plugins: [],
}
