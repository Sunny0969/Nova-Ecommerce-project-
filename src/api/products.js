import api from './client';

/**
 * Latest product reviews for SEO schema (max 5).
 * @param {string} slug
 * @param {number} [limit=5]
 */
export async function fetchProductReviews(slug, limit = 5) {
  if (!slug) return [];
  const { data } = await api.get(`/api/products/${encodeURIComponent(slug)}/reviews`, {
    params: { limit: Math.min(5, Math.max(1, limit)) }
  });
  const rows = data?.data ?? data;
  return Array.isArray(rows) ? rows : [];
}
