/** @type {import('tailwindcss').Config} */
module.exports = {
  /* Tailwind v3 JIT purges utilities from these paths in production. */
  content: [
    './src/components/**/*.{js,jsx}',
    './src/pages/**/*.{js,jsx}',
    './src/routes/**/*.{js,jsx}',
    './src/App.js',
    './src/index.js'
  ],

  corePlugins: {
    preflight: false
  },

  theme: {
    extend: {
      screens: {
        xs: '380px'
      },
      colors: {
        rozana: {
          orange: '#F97316',
          'orange-light': '#fb923c',
          'orange-dark': '#ea580c',
          navy: '#1A1A2E',
          'navy-deep': '#12121f',
          cream: '#FFF7F0',
          success: '#16A34A'
        }
      }
    }
  },

  plugins: []
};
