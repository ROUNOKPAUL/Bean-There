/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#25221e',
        cream: '#f7f5f0',
        espresso: '#3b2821',
        terracotta: '#c96743',
        sage: '#789078',
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        serif: ['"DM Serif Display"', 'serif'],
      },
      boxShadow: {
        soft: '0 16px 50px rgba(55, 43, 32, 0.08)',
      },
    },
  },
  plugins: [],
}
