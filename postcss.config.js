const purgecss = require('@fullhuman/postcss-purgecss');
const {
  content,
  storefrontContent,
  safelist,
  defaultExtractor
} = require('./purgecss.config');

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.REACT_APP_PURGE_CSS === 'true';

const useStorefrontPurge = process.env.REACT_APP_STOREFRONT_PURGE === 'true';

const purgeSources = useStorefrontPurge ? storefrontContent : content;

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    ...(isProduction
      ? [
          purgecss({
            content: purgeSources,
            safelist,
            defaultExtractor,
            variables: true,
            keyframes: true,
            fontFace: true
          })
        ]
      : [])
  ]
};
