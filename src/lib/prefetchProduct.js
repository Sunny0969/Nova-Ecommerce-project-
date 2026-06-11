/**
 * Prefetch product detail route chunk + API payload on card hover/focus.
 * Speeds up navigation on fast connections; harmless no-op when skipped (save-data / 2G).
 */

import { productsAPI } from 'api';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE = 48;

/** @type {Map<string, { storedAt: number, response: object }>} */
const productCache = new Map();
/** @type {Map<string, Promise<void>>} */
const inflight = new Map();

let detailChunkStarted = false;
let catalogChunkStarted = false;

function normalizeKey(slug) {
  return String(slug || '')
    .trim()
    .toLowerCase();
}

export function shouldPrefetchProduct() {
  if (typeof navigator === 'undefined') return true;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData) return false;
  const type = String(conn?.effectiveType || '').toLowerCase();
  if (type === 'slow-2g' || type === '2g') return false;
  return true;
}

function prefetchDetailChunks() {
  if (!detailChunkStarted) {
    detailChunkStarted = true;
    import('../pages/ProductDetail');
  }
  if (!catalogChunkStarted) {
    catalogChunkStarted = true;
    import('../pages/CatalogRoutes');
  }
}

function trimCache() {
  if (productCache.size <= MAX_CACHE) return;
  const oldest = [...productCache.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt);
  while (productCache.size > MAX_CACHE && oldest.length) {
    const [key] = oldest.shift();
    productCache.delete(key);
  }
}

/**
 * Warm JS chunks + product API for a slug (deduped).
 * @param {string} slug
 */
export function prefetchProductPage(slug) {
  const key = normalizeKey(slug);
  if (!key || !shouldPrefetchProduct()) return;

  prefetchDetailChunks();

  const cached = productCache.get(key);
  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) return;
  if (inflight.has(key)) return inflight.get(key);

  const task = productsAPI
    .getOne(key)
    .then((response) => {
      productCache.set(key, { storedAt: Date.now(), response });
      trimCache();
    })
    .catch(() => {})
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, task);
  return task;
}

/**
 * @param {string} slug
 * @returns {object|null} Axios-like response from prefetch cache
 */
export function getPrefetchedProductResponse(slug) {
  const key = normalizeKey(slug);
  if (!key) return null;
  const hit = productCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.storedAt > CACHE_TTL_MS) {
    productCache.delete(key);
    return null;
  }
  return hit.response;
}

/** Remove cached entry after successful consume (optional fresh fetch on revisit). */
export function clearPrefetchedProduct(slug) {
  productCache.delete(normalizeKey(slug));
}
