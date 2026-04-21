/**
 * Central SEO configuration — Nova Shop (Create React App).
 * Use with react-helmet-async. For production, set REACT_APP_SITE_URL to the canonical
 * public origin (no trailing slash), e.g. https://www.example.com
 */

/** @type {string} Human-readable site name (brand) */
export const siteName = 'Nova Shop';

/** Home hero image (LCP); keep in sync with `Home.js` hero `<img>` src for preload. */
export const homeHeroImageUrl =
  'https://images.unsplash.com/photo-1625432800813-5cad3897cf22?w=1400&auto=format&fit=crop&q=82&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8a2FzaG1pcmklMjBzaGF3bHxlbnwwfDF8MHx8fDI%3D';

/** Home promo strip background — CSS `url()` in `Home.js` via `--promo-bg-image`. */
export const promoBannerBgUrl =
  'https://images.unsplash.com/photo-1561767655-2e0cad0408c7?w=1600&auto=format&fit=crop&q=82&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDN8fGZhc2hpb24lMjBiYWNrZ3JvdW5kJTIwYmFubmVyfGVufDB8MHwwfHx8Mg%3D%3D';

/** Login / register page background — `Login.js` sets `--auth-page-bg-image`. */
export const authLoginBgUrl =
  'https://images.unsplash.com/photo-1721152531086-70a0d0bb33f9?w=1600&auto=format&fit=crop&q=82&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTV8fGZhc2hpb24lMjBiYWNrZ3JvdW5kJTIwYmFubmVyfGVufDB8MHwwfHx8Mg%3D%3D';

/**
 * Public site origin, no trailing slash.
 * Prefer REACT_APP_SITE_URL in production; falls back to window.location.origin in the browser.
 */
export function getSiteUrl() {
  const env = typeof process !== 'undefined' && process.env && process.env.REACT_APP_SITE_URL;
  if (env != null && String(env).trim() !== '') {
    return normalizeBaseUrl(String(env).trim());
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return normalizeBaseUrl(window.location.origin);
  }
  return '';
}

function normalizeBaseUrl(url) {
  return String(url).replace(/\/+$/, '');
}

/**
 * Base URL for meta tags, canonical, and sitemap-style links.
 * Same as getSiteUrl(); alias for readability in route-level SEO code.
 */
export const getBaseUrl = getSiteUrl;

/**
 * Default document title (shown when a route does not set a <title>).
 * Distinct from the per-page title template in {@link titleTemplate}.
 */
export const defaultTitle = 'Nova Shop | Premium Products Delivered';

/**
 * When using short segment titles, full title = titleTemplate with %s replaced, e.g.
 * `formatPageTitle('My Account')` → "My Account | Nova Shop"
 */
export const titleTemplate = '%s | Nova Shop';

/**
 * Google typically displays ~150–160 characters; this default is 155.
 * Keep in sync with `public/index.html` meta name="description" (first paint / no-JS).
 */
export const defaultDescription =
  'Nova Shop: your store for premium products, fast delivery, and secure payment. Curated quality, easy returns, and support. Shop online with confidence now.';

if (defaultDescription.length !== 155) {
  // Defensive: avoid silent length drift
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      `[seo] defaultDescription should be 155 characters for GSC; got ${defaultDescription.length}`
    );
  }
}

/** Add this file to `public/` (recommended 1200×630 PNG) for best OG/Twitter previews. */
export const defaultOgImagePath = '/og-image.png';

/**
 * Absolute Open Graph / Twitter default image URL.
 * Uses {@link getSiteUrl} + {@link defaultOgImagePath}; in dev without REACT_APP_SITE_URL,
 * still returns an absolute URL when running in the browser.
 */
export function getDefaultOgImageUrl() {
  const base = getSiteUrl();
  if (!base) {
    if (typeof window !== 'undefined' && window.location) {
      return new URL(defaultOgImagePath, window.location.origin).href;
    }
    return defaultOgImagePath;
  }
  return `${base}${defaultOgImagePath.startsWith('/') ? '' : '/'}${defaultOgImagePath}`;
}

/** @type {string} e.g. en_US — for og:locale */
export const defaultOgLocale = 'en_US';

/** @type {string} Default og:type for the storefront */
export const defaultOgType = 'website';

/**
 * Formats a short page segment into a full <title> using {@link titleTemplate}.
 * @param {string} [titleSegment] — e.g. "Sign in" → "Sign in | Nova Shop"
 * @returns {string}
 */
export function formatPageTitle(titleSegment) {
  if (titleSegment == null || String(titleSegment).trim() === '') {
    return defaultTitle;
  }
  return titleTemplate.replace('%s', String(titleSegment).trim());
}

/**
 * Canonical URL for the current or given path (pathname only; strips hash; optional search).
 * Prefer pathname-only for listings to avoid duplicate content from ?page=, etc.
 * @param {string} pathname - e.g. from useLocation().pathname
 * @param {object} [options]
 * @param {string} [options.search] - include query string (use sparingly)
 * @returns {string}
 */
export function getCanonicalUrl(pathname, options = {}) {
  const base = getSiteUrl();
  const path = !pathname || pathname === '' ? '/' : pathname.startsWith('/') ? pathname : `/${pathname}`;
  let url = base ? `${base}${path === '//' ? '/' : path}` : path;
  if (options.search && String(options.search)) {
    const s = String(options.search);
    url += s.startsWith('?') ? s : `?${s}`;
  }
  return url;
}

/**
 * Default / global meta props for a consistent OG + Twitter card baseline.
 * Routes can override with more specific <meta property="og:*" /> tags.
 * @param {string} [pathname] - from useLocation().pathname
 */
export function getDefaultMetaGroups(pathname = '/') {
  const canonical = getCanonicalUrl(pathname);
  const ogImage = getDefaultOgImageUrl();
  return {
    siteName,
    defaultTitle,
    defaultDescription,
    titleTemplate,
    canonical,
    og: {
      type: defaultOgType,
      site_name: siteName,
      title: defaultTitle,
      description: defaultDescription,
      url: canonical,
      locale: defaultOgLocale,
      image: ogImage
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultTitle,
      description: defaultDescription,
      image: ogImage
    }
  };
}

/**
 * WebSite + SearchAction (sitelinks search box) — e.g. `/shop?search={search_term_string}`
 * @param {string} [baseUrl] - public origin; default getSiteUrl() or dev origin
 * @param {string} [searchParam] - query key; default "search" (see Products page)
 */
export function buildWebSiteWithSearchActionSchema(baseUrl, searchParam = 'search') {
  let base = baseUrl != null && String(baseUrl).trim() ? normalizeBaseUrl(String(baseUrl).trim()) : getSiteUrl();
  if (!base && typeof window !== 'undefined' && window.location?.origin) {
    base = normalizeBaseUrl(window.location.origin);
  }
  if (!base) base = 'https://example.com';
  const sp = String(searchParam || 'search');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/shop?${sp}={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

/**
 * BreadcrumbList JSON-LD (Product, Shop + category, etc.)
 * @param {Array<{ name: string, path?: string, url?: string }>} items
 * - `path`: site path starting with `/` (passed through getCanonicalUrl)
 * - `url`: absolute page URL; wins over `path`
 * @returns {object|null}
 */
export function buildBreadcrumbListSchema(items) {
  if (!Array.isArray(items) || !items.length) return null;
  const itemListElement = items.map((it, i) => {
    const name = (it && String(it.name || '').trim()) || 'Page';
    let item;
    if (it.url != null && String(it.url).trim() !== '') {
      const u = String(it.url).trim();
      if (u.startsWith('http://') || u.startsWith('https://')) item = u;
      else {
        const path = u.startsWith('/') ? u : `/${u}`;
        item = getCanonicalUrl(path);
      }
    } else {
      const p = it.path != null && String(it.path).trim() !== '' ? String(it.path).trim() : '/';
      const path = p.startsWith('/') ? p : `/${p}`;
      item = getCanonicalUrl(path);
    }
    return {
      '@type': 'ListItem',
      position: i + 1,
      name,
      item
    };
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  };
}

/**
 * Breadcrumb-style title for `/account/*` (used with <SEO>).
 * @param {string} pathname
 * @returns {string}
 */
export function getAccountSeoTitle(pathname) {
  const p = (pathname || '').replace(/\/$/, '') || '/account';
  if (p === '/account') return 'My account';
  if (p === '/account/orders') return 'My orders';
  if (p.startsWith('/account/orders/')) return 'Order details';
  if (p === '/account/profile') return 'Profile';
  if (p === '/account/addresses') return 'Addresses';
  if (p === '/account/wishlist') return 'Wishlist';
  if (p === '/account/reviews') return 'My reviews';
  return 'My account';
}

/**
 * Title for `/admin/*` routes.
 * @param {string} pathname
 * @returns {string}
 */
export function getAdminSeoTitle(pathname) {
  const p = (pathname || '').replace(/\/$/, '') || '/admin';
  if (p === '/admin') return 'Admin dashboard';
  if (p === '/admin/products') return 'Products';
  if (p === '/admin/products/new') return 'New product';
  if (/\/admin\/products\/[a-f\d]{24}\/edit$/i.test(p)) return 'Edit product';
  if (p === '/admin/orders') return 'Orders';
  if (/\/admin\/orders\/[a-f\d]{24}/i.test(p) && p !== '/admin/orders') return 'Order';
  if (p === '/admin/categories') return 'Categories';
  if (p === '/admin/customers') return 'Customers';
  if (p === '/admin/coupons') return 'Coupons';
  if (p === '/admin/analytics') return 'Analytics';
  if (p === '/admin/store-settings') return 'Shipping & tax';
  if (p.startsWith('/admin')) {
    const parts = p.split('/').filter(Boolean);
    if (parts.length) {
      const last = parts[parts.length - 1];
      if (last && !/^[a-f\d]{24}$/i.test(last) && !['edit', 'new'].includes(last)) {
        return last.charAt(0).toUpperCase() + last.slice(1);
      }
    }
  }
  return 'Admin';
}
