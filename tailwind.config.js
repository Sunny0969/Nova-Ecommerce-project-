/** @type {import('tailwindcss').Config} */

module.exports = {

  content: ['./src/**/*.{js,jsx,ts,tsx}'],

  corePlugins: {

    preflight: false,

  },

  theme: {

    extend: {

      screens: {

        xs: '380px',

      },

      colors: {

        rozana: {

          orange: '#F97316',

          'orange-light': '#fb923c',

          'orange-dark': '#ea580c',

          navy: '#1A1A2E',

          'navy-deep': '#12121f',

          cream: '#FFF7F0',

          success: '#16A34A',

        },

      },

    },

  },

  plugins: [],

};


