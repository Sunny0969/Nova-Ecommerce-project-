import api from './client';

/** Public store pricing (shipping thresholds, tax rate) — no auth required */
export const storeSettingsAPI = {
  get: () => api.get('/api/store-settings')
};

/** Public homepage metrics — no auth required */
export const publicAPI = {
  homeStats: () => api.get('/api/public/home-stats'),
  promoTicker: () => api.get('/api/public/promo-ticker'),
  getStripeConfig: () => api.get('/api/public/stripe-config'),
  validateCoupon: (body) => api.post('/api/public/validate-coupon', body, { skipAuthRedirect: true })
};

/**
 * Products — `/api/products/*`
 */
export const productsAPI = {
  getAll: (params) => api.get('/api/products', { params }),

  /** Public detail by slug (published products) */
  getOne: (slug) => api.get(`/api/products/${encodeURIComponent(slug)}`),

  getFeatured: () => api.get('/api/products/featured'),

  getFlashSale: (params) => api.get('/api/products/flash-sale', { params }),

  getHomeCategorySales: (params) => api.get('/api/products/home-category-sales', { params }),

  search: (params) =>
    api.get('/api/products/search', {
      params: typeof params === 'string' ? { q: params } : params
    }),

  /** AI hybrid semantic search */
  aiSearch: (params) =>
    api.get('/api/products/ai-search', {
      params: typeof params === 'string' ? { q: params } : params
    }),

  /** `id` = Mongo ObjectId */
  addReview: (id, body) => api.post(`/api/products/${id}/reviews`, body),

  addReviewWithImages: (id, { rating, topic, comment, imageFiles = [] }) => {
    const fd = new FormData();
    const ratingNum = Math.round(Number(rating));
    fd.append('rating', String(ratingNum));
    fd.append('topic', topic || '');
    fd.append('comment', comment || '');
    fd.append(
      'reviewJson',
      JSON.stringify({ rating: ratingNum, topic: topic || '', comment: comment || '' })
    );
    imageFiles.forEach((file) => fd.append('images', file));
    return api.post(`/api/products/${id}/reviews`, fd);
  },

  updateReview: (productId, reviewId, body) =>
    api.put(`/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`, body),

  /** Photos only — send rating/topic/comment as JSON in a separate call. */
  appendReviewImages: (productId, reviewId, imageFiles = []) => {
    const fd = new FormData();
    imageFiles.forEach((file) => fd.append('images', file));
    return api.put(
      `/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
      fd
    );
  },

  updateReviewWithImages: (productId, reviewId, { rating, topic, comment, imageFiles = [] }) => {
    const fd = new FormData();
    const ratingNum = rating != null ? Math.round(Number(rating)) : null;
    if (ratingNum != null) fd.append('rating', String(ratingNum));
    if (topic != null) fd.append('topic', topic);
    if (comment != null) fd.append('comment', comment);
    fd.append(
      'reviewJson',
      JSON.stringify({
        rating: ratingNum,
        topic: topic || '',
        comment: comment || ''
      })
    );
    imageFiles.forEach((file) => fd.append('images', file));
    return api.put(
      `/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
      fd
    );
  },

  deleteReview: (productId, reviewId) =>
    api.delete(
      `/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`
    )
};

export const recommendationsAPI = {
  homepage: (params) => api.get('/api/recommendations/homepage', { params }),
  similar: (productId, params) =>
    api.get(`/api/recommendations/similar/${encodeURIComponent(productId)}`, { params }),
  frequentlyBought: (productId, params) =>
    api.get(`/api/recommendations/frequently-bought/${encodeURIComponent(productId)}`, { params }),
  trending: (params) => api.get('/api/recommendations/trending', { params }),
  recentlyViewed: (params) => api.get('/api/recommendations/recently-viewed', { params })
};

/**
 * Cart — `/api/cart/*` (JWT required on server)
 */
export const cartAPI = {
  get: () => api.get('/api/cart'),

  addItem: (body) => api.post('/api/cart/add', body),

  updateItem: (body) => api.put('/api/cart/update', body),

  removeItem: (productId) =>
    api.delete(`/api/cart/remove/${encodeURIComponent(productId)}`),

  clear: () => api.delete('/api/cart/clear'),

  applyCoupon: (code) =>
    api.post('/api/cart/coupon', typeof code === 'string' ? { code } : code),

  removeCoupon: () => api.delete('/api/cart/coupon')
};
