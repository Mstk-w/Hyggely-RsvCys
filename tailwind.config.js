/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hyggelyブランドカラー（カンパーニュ・ベーカリーをイメージ）
        primary: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d9c0',
          300: '#e9be95',
          400: '#de9d68',
          500: '#d58347',
          600: '#c76b3c',
          700: '#a55433',
          800: '#85452f',
          900: '#6c3a29',
          950: '#3a1c14',
        },
        secondary: {
          50: '#f6f5f0',
          100: '#e9e6db',
          200: '#d5cfba',
          300: '#bcb293',
          400: '#a79875',
          500: '#98875f',
          600: '#8b7854',
          700: '#726046',
          800: '#604f3d',
          900: '#524436',
          950: '#2e241c',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
