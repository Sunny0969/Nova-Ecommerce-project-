/**
 * Build-time prerender configuration (CRA + Hostinger static deploy).
 * Override with env: PRERENDER_API_URL, PRERENDER_SITE_URL, PRERENDER_MAX_CATEGORIES
 */
const RESERVED_CATEGORY_SLUGS = new Set([
  'home',
  'shop',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'verify-email',
  'cart',
  'checkout',
  'order-confirmation',
  'account',
  'orders',
  'wishlist',
  'blog',
  'brands',
  'brand',
  'products',
  'product',
  'category',
  'about-us',
  'privacy-policy',
  'contact-us',
  'faqs',
  'terms-and-conditions',
  'returns-and-refunds',
  'shipping-policy',
  'admin',
  'staff',
  'api',
  'static'
]);

module.exports = {
  siteUrl: (process.env.PRERENDER_SITE_URL || 'https://www.bazaar-pk.com').replace(/\/+$/, ''),
  apiBaseUrl: (process.env.PRERENDER_API_URL || process.env.REACT_APP_API_URL || 'https://nova-ecommerce-project-backend-production.up.railway.app').replace(/\/+$/, ''),
  productsPerPage: Number(process.env.PRERENDER_PRODUCTS_PER_PAGE || 48),
  /** 0 = all categories */
  maxCategories: Number(process.env.PRERENDER_MAX_CATEGORIES || 0),
  /** 0 = all published products */
  maxProducts: Number(process.env.PRERENDER_MAX_PRODUCTS || 0),
  homeFeaturedLimit: Number(process.env.PRERENDER_HOME_PRODUCTS || 24),
  productFetchConcurrency: Number(process.env.PRERENDER_CONCURRENCY || 8),
  /** Set PRERENDER_ENRICH_PRODUCTS=1 to fetch full description per product (slow, can fail on Railway). */
  enrichProductDetails: process.env.PRERENDER_ENRICH_PRODUCTS === '1',
  reservedCategorySlugs: RESERVED_CATEGORY_SLUGS,
  staticRoutes: ['/', '/shop']
};
