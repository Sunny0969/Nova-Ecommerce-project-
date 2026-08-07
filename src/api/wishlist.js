import api from './client';

/**
 * Wishlist — `/api/wishlist/*` (JWT)
 */
export const wishlistAPI = {
  get: () => api.get('/api/wishlist'),

  /**
   * Toggle add/remove — POST /api/wishlist/toggle with body (avoids path/proxy 404s).
   * @param {string} productId — Mongo _id or slug
   */
  toggle: (productId) =>
    api.post('/api/wishlist/toggle', { productId: String(productId) }),

  clear: () => api.delete('/api/wishlist'),

  remove: (productId) =>
    api.delete(`/api/wishlist/${encodeURIComponent(productId)}`)
};
