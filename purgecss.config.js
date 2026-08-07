/**
 * PurgeCSS — production-only dead CSS removal.
 * Scans React source; safelist keeps dynamic/state class modifiers intact.
 */
const path = require('path');

const frontendRoot = __dirname;
const srcRoot = path.join(frontendRoot, 'src');

/** Normalize for fast-glob on Windows (backslashes break absolute globs). */
function globPath(...segments) {
  return path.join(...segments).replace(/\\/g, '/');
}

/** All JSX/JS that can emit class names (storefront + admin for split CSS chunks). */
const content = [
  globPath(srcRoot, 'index.js'),
  globPath(srcRoot, 'App.js'),
  globPath(srcRoot, 'components/**/*.{js,jsx}'),
  globPath(srcRoot, 'pages/**/*.{js,jsx}'),
  globPath(srcRoot, 'routes/**/*.{js,jsx}'),
  globPath(srcRoot, 'context/**/*.{js,jsx}'),
  globPath(srcRoot, 'hooks/**/*.{js,jsx}'),
  globPath(srcRoot, 'lib/**/*.{js,jsx}'),
  globPath(srcRoot, 'utils/**/*.{js,jsx}'),
  globPath(srcRoot, 'api/**/*.{js,jsx}'),
  globPath(srcRoot, 'config/**/*.{js,jsx}'),
  globPath(srcRoot, 'assets/**/*.{js,jsx,css}'),
  globPath(frontendRoot, 'public/index.html')
];

/** Storefront-only scan — used when REACT_APP_STOREFRONT_PURGE=true. */
const storefrontContent = [
  globPath(srcRoot, 'index.js'),
  globPath(srcRoot, 'App.js'),
  globPath(srcRoot, 'components/**/*.{js,jsx}'),
  globPath(srcRoot, 'pages/**/*.{js,jsx}'),
  globPath(srcRoot, 'routes/Storefront*.jsx'),
  globPath(srcRoot, 'routes/RouteTree.jsx'),
  globPath(srcRoot, 'routes/StorefrontRoutes.jsx'),
  globPath(srcRoot, 'routes/StorefrontAppRoutes.jsx'),
  globPath(srcRoot, 'context/**/*.{js,jsx}'),
  globPath(srcRoot, 'hooks/**/*.{js,jsx}'),
  globPath(srcRoot, 'lib/**/*.{js,jsx}'),
  globPath(srcRoot, 'utils/**/*.{js,jsx}'),
  globPath(srcRoot, 'api/**/*.{js,jsx}'),
  globPath(srcRoot, 'config/**/*.{js,jsx}'),
  globPath(srcRoot, 'assets/**/*.{js,jsx,css}'),
  globPath(frontendRoot, 'public/index.html')
];

const safelist = {
  standard: [
    'html',
    'body',
    'active',
    'open',
    'show',
    'visible',
    'hidden',
    'in',
    'out',
    'disabled',
    'loading',
    'error',
    'success',
    'collapsed',
    'expanded',
    'btn',
    'container',
    'App'
  ],
  deep: [
    /react-hot-toast/,
    /Toastify/,
    /skeleton/,
    /animate-spin/,
    /jodit/,
    /recharts/,
    /Stripe/,
    /pac-container/
  ],
  greedy: [
    /^is-/,
    /^btn/,
    /^nav-/,
    /^cart-/,
    /^product-/,
    /^checkout-/,
    /^account-/,
    /^shop-/,
    /^home-/,
    /^page-/,
    /--active$/,
    /--selected$/,
    /--visible$/,
    /--open$/,
    /--empty$/,
    /--loading$/,
    /--disabled$/,
    /__status--/,
    /-active$/,
    /-visible$/,
    /-open$/,
    /-in$/,
    /-out$/
  ]
};

module.exports = {
  content,
  storefrontContent,
  safelist,
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || []
};
