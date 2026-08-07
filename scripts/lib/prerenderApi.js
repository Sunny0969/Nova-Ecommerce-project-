const config = require('../prerender.config');

const DEFAULT_RAILWAY =
  'https://nova-ecommerce-project-backend-production.up.railway.app';
const LOCAL_API = 'http://127.0.0.1:5001';

function apiBaseCandidates() {
  const explicit = (process.env.PRERENDER_API_URL || process.env.REACT_APP_API_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const list = [];
  if (explicit) list.push(explicit);
  if (!list.includes(LOCAL_API)) list.push(LOCAL_API);
  if (!list.includes(DEFAULT_RAILWAY)) list.push(DEFAULT_RAILWAY);
  return list;
}

let activeApiBase = apiBaseCandidates()[0];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonOnce(baseUrl, path) {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Bazaar-Prerender/1.0' },
    signal: AbortSignal.timeout(45000)
  });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  if (body?.success === false) {
    throw new Error(body.message || `API error for ${path}`);
  }
  return body?.data ?? body;
}

async function fetchJson(path) {
  const bases = apiBaseCandidates();
  let lastError = null;

  for (const base of bases) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const data = await fetchJsonOnce(base, path);
        activeApiBase = base;
        return data;
      } catch (err) {
        lastError = err;
        if (attempt < 3) await sleep(400 * attempt);
      }
    }
  }

  throw lastError || new Error(`fetch failed for ${path}`);
}

function getActiveApiBase() {
  return activeApiBase;
}

function unwrapProducts(data) {
  if (Array.isArray(data)) {
    return { products: data, totalCount: data.length, totalPages: 1, currentPage: 1 };
  }
  return {
    products: data?.products || [],
    totalCount: data?.totalCount ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1
  };
}

async function fetchCategories() {
  const rows = await fetchJson('/api/categories');
  const list = Array.isArray(rows) ? rows : [];
  return list
    .filter((cat) => {
      const slug = String(cat.slug || '').trim().toLowerCase();
      return slug && !config.reservedCategorySlugs.has(slug);
    })
    .sort((a, b) =>
      String(a.name || a.slug || '').localeCompare(String(b.name || b.slug || ''), 'en', {
        sensitivity: 'base',
        numeric: true
      })
    );
}

async function fetchProducts(params = {}) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page || 1));
  qs.set('limit', String(params.limit || config.productsPerPage));
  if (params.category) qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  if (params.brand) qs.set('brand', params.brand);
  const data = await fetchJson(`/api/products?${qs.toString()}`);
  return unwrapProducts(data);
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const batch = await fetchProducts({ page, limit: config.productsPerPage });
    all.push(...batch.products);
    totalPages = Math.max(1, Number(batch.totalPages) || 1);
    if (!batch.products.length) break;
    page += 1;
  } while (page <= totalPages);

  return all;
}

async function fetchProductDetail(slug) {
  if (!slug) return null;
  try {
    const data = await fetchJson(`/api/products/${encodeURIComponent(slug)}`);
    if (data?.unavailable) return null;
    return data;
  } catch {
    return null;
  }
}

async function fetchProductReviews(slug, limit = 5) {
  if (!slug) return [];
  try {
    const data = await fetchJson(
      `/api/products/${encodeURIComponent(slug)}/reviews?limit=${Math.min(5, Math.max(1, limit))}`
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchBrands() {
  const rows = await fetchJson('/api/brands');
  return Array.isArray(rows) ? rows : [];
}

async function fetchHomeStats() {
  try {
    return await fetchJson('/api/public/home-stats');
  } catch {
    return null;
  }
}

async function fetchPromoTicker() {
  try {
    const data = await fetchJson('/api/public/promo-ticker');
    return Array.isArray(data?.items) ? data.items : [];
  } catch {
    return [];
  }
}

async function fetchBlogPosts() {
  const endpoints = ['/api/blog/posts', '/api/blogs'];
  for (const endpoint of endpoints) {
    try {
      const body = await fetchJson(endpoint);
      if (Array.isArray(body?.posts)) return body.posts;
      if (Array.isArray(body)) return body;
    } catch {
      /* try next endpoint */
    }
  }
  return [];
}

/**
 * Run async mapper with limited concurrency.
 */
async function mapWithConcurrency(items, limit, mapper) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];
  const concurrency = Math.max(1, Math.min(limit, list.length));
  const results = new Array(list.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < list.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(list[index], index);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

module.exports = {
  fetchCategories,
  fetchProducts,
  fetchAllProducts,
  fetchProductDetail,
  fetchProductReviews,
  fetchBrands,
  fetchBlogPosts,
  fetchHomeStats,
  fetchPromoTicker,
  mapWithConcurrency,
  getActiveApiBase,
  apiBaseCandidates
};
