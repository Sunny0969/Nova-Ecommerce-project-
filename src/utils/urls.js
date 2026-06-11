/**
 * SEO-friendly storefront URL helpers.
 * Canonical patterns:
 *   /                          — home
 *   /about-us                  — static pages
 *   /wooden-handicrafts        — category listing
 *   /wooden-handicrafts/wooden-tray — product detail
 *   /shop                      — all products (browse)
 */

const FILTER_QUERY_KEYS = ['page', 'sort', 'search', 'minPrice', 'maxPrice', 'rating', 'inStock', 'onSale', 'tag'];

/** First path segments that are app routes, not category slugs */
export const RESERVED_CATALOG_SLUGS = new Set([
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
  'admin',
  'staff',
  'api'
]);

export function normalizeSlug(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isReservedCatalogSlug(slug) {
  const s = normalizeSlug(slug);
  return !s || RESERVED_CATALOG_SLUGS.has(s);
}

/** Product detail — e.g. /wooden-handicrafts/wooden-tray */
export function getProductCategorySlug(product) {
  if (!product) return '';
  if (product.categorySlug) return normalizeSlug(product.categorySlug);
  const c = product.category;
  if (typeof c === 'object' && c?.slug) return normalizeSlug(c.slug);
  if (typeof c === 'string' && c.trim()) return normalizeSlug(c);
  return '';
}

export function buildProductPath(slug, categorySlug) {
  const s = normalizeSlug(slug) || String(slug || '').trim();
  if (!s) return '/shop';
  const cat = normalizeSlug(categorySlug);
  if (cat && !isReservedCatalogSlug(cat)) {
    return `/${encodeURIComponent(cat)}/${encodeURIComponent(s)}`;
  }
  return buildLegacyProductPath(s);
}

/** Legacy flat product URL — redirects client-side to canonical category path */
export function buildLegacyProductPath(slug) {
  const s = normalizeSlug(slug) || String(slug || '').trim();
  if (!s) return '/shop';
  return `/shop/${encodeURIComponent(s)}`;
}

/** Legacy category listing — redirects to canonical /{slug} */
export function buildLegacyCategoryPath(slug) {
  const s = normalizeSlug(slug);
  if (!s) return '/shop';
  return `/shop/category/${encodeURIComponent(s)}`;
}

/** Category listing — e.g. /groceries */
export function buildCategoryPath(slug) {
  const s = normalizeSlug(slug);
  if (!s) return '/shop';
  if (isReservedCatalogSlug(s)) return '/shop';
  return `/${encodeURIComponent(s)}`;
}

/** Brand listing — e.g. /brand/nestle */
export function buildBrandPath(slug) {
  const s = normalizeSlug(slug);
  if (!s) return '/brands';
  return `/brand/${encodeURIComponent(s)}`;
}

/** Sale within category — filters stay in query */
export function buildCategorySalePath(slug) {
  return `${buildCategoryPath(slug)}?onSale=true`;
}

export function categoriesFromSearchParams(searchParams) {
  if (!searchParams) return [];
  const multi = searchParams.getAll('category');
  if (multi.length) {
    return [...new Set(multi.map((s) => normalizeSlug(s) || String(s).trim()).filter(Boolean))];
  }
  const legacy = searchParams.get('cat');
  if (legacy && legacy !== 'all') return [normalizeSlug(legacy) || String(legacy).trim()];
  return [];
}

export function parseShopPath(pathname = '') {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  let categorySlug = null;
  let brandSlug = null;
  let productSlug = null;

  // Legacy: /shop/category/:cat/:product
  const legacyProductMatch = path.match(/^\/shop\/category\/([^/?#]+)\/([^/?#]+)/i);
  if (legacyProductMatch) {
    categorySlug =
      normalizeSlug(decodeURIComponent(legacyProductMatch[1])) ||
      decodeURIComponent(legacyProductMatch[1]).toLowerCase();
    productSlug =
      normalizeSlug(decodeURIComponent(legacyProductMatch[2])) ||
      decodeURIComponent(legacyProductMatch[2]).toLowerCase();
    return { categorySlug, brandSlug, productSlug };
  }

  // Legacy: /shop/category/:cat
  const legacyCatMatch = path.match(/^\/shop\/category\/([^/?#]+)/i);
  if (legacyCatMatch) {
    categorySlug =
      normalizeSlug(decodeURIComponent(legacyCatMatch[1])) ||
      decodeURIComponent(legacyCatMatch[1]).toLowerCase();
    return { categorySlug, brandSlug, productSlug };
  }

  const brandMatch = path.match(/^\/brand\/([^/?#]+)/i);
  if (brandMatch) {
    brandSlug = normalizeSlug(decodeURIComponent(brandMatch[1])) || decodeURIComponent(brandMatch[1]).toLowerCase();
    return { categorySlug, brandSlug, productSlug };
  }

  // Canonical: /category-slug/product-slug
  const rootProductMatch = path.match(/^\/([^/?#]+)\/([^/?#]+)$/i);
  if (rootProductMatch) {
    const cat =
      normalizeSlug(decodeURIComponent(rootProductMatch[1])) ||
      decodeURIComponent(rootProductMatch[1]).toLowerCase();
    const prod =
      normalizeSlug(decodeURIComponent(rootProductMatch[2])) ||
      decodeURIComponent(rootProductMatch[2]).toLowerCase();
    if (cat && prod && !isReservedCatalogSlug(cat)) {
      categorySlug = cat;
      productSlug = prod;
    }
    return { categorySlug, brandSlug, productSlug };
  }

  // Canonical: /category-slug
  const rootCatMatch = path.match(/^\/([^/?#]+)$/i);
  if (rootCatMatch) {
    const cat =
      normalizeSlug(decodeURIComponent(rootCatMatch[1])) ||
      decodeURIComponent(rootCatMatch[1]).toLowerCase();
    if (cat && !isReservedCatalogSlug(cat)) {
      categorySlug = cat;
    }
  }

  return { categorySlug, brandSlug, productSlug };
}

/** True when pathname is a root-level category or product catalog URL */
export function isRootCatalogPath(pathname = '') {
  const { categorySlug } = parseShopPath(pathname);
  return Boolean(categorySlug);
}

/** Preserve sort/search/page filters without category/brand query keys */
export function shopFiltersOnlyQuery(searchParams) {
  const next = new URLSearchParams();
  FILTER_QUERY_KEYS.forEach((key) => {
    if (searchParams.has(key)) next.set(key, searchParams.get(key));
  });
  return next.toString();
}

/** True when legacy /shop?category=… should not auto-redirect to a path URL */
export function shouldStayOnLegacyShopQuery(searchParams) {
  const cats = categoriesFromSearchParams(searchParams);
  if (cats.length > 1) return true;
  if (cats.length >= 1 && searchParams.has('brand')) return true;
  return false;
}

/**
 * Canonical path for shop listings (path-based when possible).
 */
export function getShopListingCanonicalPath(searchParams, pathname = '/shop') {
  const { categorySlug, brandSlug } = parseShopPath(pathname);
  if (brandSlug) return buildBrandPath(brandSlug);
  if (categorySlug) return buildCategoryPath(categorySlug);

  const brand = (searchParams.get('brand') || '').trim().toLowerCase();
  if (brand && !shouldStayOnLegacyShopQuery(searchParams)) return buildBrandPath(brand);

  const cats = categoriesFromSearchParams(searchParams);
  if (cats.length === 1 && !shouldStayOnLegacyShopQuery(searchParams)) return buildCategoryPath(cats[0]);

  return '/shop';
}
