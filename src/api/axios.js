import axios from 'axios';

/** Keep in sync with `AuthContext` token storage */
export const TOKEN_KEY = 'nova_shop_token';

function normalizeApiOrigin(url) {
  if (url == null || url === '') return '';
  let u = String(url).trim().replace(/\/$/, '');
  if (u.endsWith('/api')) u = u.slice(0, -4);
  return u;
}

/**
 * Production API (Render) — hardcoded so Hostinger builds never miss env vars.
 * Optional override: `public/api-config.js` sets `window.__REACT_APP_API_URL__` (e.g. to test another API).
 * Local `npm start`: uses http://localhost:5000 (your machine’s backend).
 */
const HARDCODED_PRODUCTION_API = 'https://nova-ecommerce-project-backend.onrender.com';

function readRuntimeApiOrigin() {
  if (typeof window === 'undefined' || !window.__REACT_APP_API_URL__) {
    return '';
  }
  return String(window.__REACT_APP_API_URL__);
}

const baseURL = normalizeApiOrigin(
  readRuntimeApiOrigin() ||
    (process.env.NODE_ENV === 'production'
      ? HARDCODED_PRODUCTION_API
      : 'http://localhost:5000')
);

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/** Public store pricing (shipping thresholds, tax rate) — no auth required */
export const storeSettingsAPI = {
  get: () => api.get('/api/store-settings')
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nova_shop_token');
    const staffToken = localStorage.getItem('staffToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else if (staffToken) config.headers.Authorization = `Bearer ${staffToken}`;
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      if (config.headers.common) {
        delete config.headers.common['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const cfg = error.config || {};
    const url = String(cfg.url || '');

    if (status === 401) {
      const skipRedirect =
        cfg.skipAuthRedirect === true ||
        /\/auth\/(login|register|forgot-password|reset-password)(\?|$)/.test(url);

      if (!skipRedirect) {
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common.Authorization;
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Auth — `/api/auth/*`
 * Note: `updateProfile`, `forgotPassword`, `resetPassword` expect matching backend routes.
 */
export const authAPI = {
  login: (body) =>
    api.post('/api/auth/login', body, { skipAuthRedirect: true }),

  register: (body) =>
    api.post('/api/auth/register', body, { skipAuthRedirect: true }),

  logout: () =>
    api.post('/api/auth/logout', {}, { skipAuthRedirect: true }),

  getMe: () => api.get('/api/auth/me'),

  saveShippingAddress: (body) => api.patch('/api/auth/me/shipping', body),

  updateProfile: (body) => api.patch('/api/auth/profile', body),

  changePassword: (body) => api.post('/api/auth/change-password', body),

  uploadAvatar: (formData) => api.post('/api/auth/avatar', formData),

  listAddresses: () => api.get('/api/auth/addresses'),

  createAddress: (body) => api.post('/api/auth/addresses', body),

  updateAddress: (id, body) => api.patch(`/api/auth/addresses/${encodeURIComponent(id)}`, body),

  deleteAddress: (id) => api.delete(`/api/auth/addresses/${encodeURIComponent(id)}`),

  setDefaultAddress: (id) =>
    api.patch(`/api/auth/addresses/${encodeURIComponent(id)}/default`, {}),

  myReviews: () => api.get('/api/auth/reviews'),

  forgotPassword: (body) =>
    api.post('/api/auth/forgot-password', body, { skipAuthRedirect: true }),

  resetPassword: (body) =>
    api.post('/api/auth/reset-password', body, { skipAuthRedirect: true })
};

/**
 * Products — `/api/products/*`
 */
export const productsAPI = {
  getAll: (params) => api.get('/api/products', { params }),

  /** Public detail by slug (published products) */
  getOne: (slug) => api.get(`/api/products/${encodeURIComponent(slug)}`),

  getFeatured: () => api.get('/api/products/featured'),

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

  updateReview: (productId, reviewId, body) =>
    api.put(`/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`, body),

  deleteReview: (productId, reviewId) =>
    api.delete(
      `/api/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`
    )
};

export const eventsAPI = {
  log: (body) => api.post('/api/events', body)
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

export const chatbotAPI = {
  message: (body) => api.post('/api/chatbot/message', body)
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

/**
 * Orders — `/api/orders/*` (JWT) + Stripe checkout step
 */
export const ordersAPI = {
  /**
   * Starts checkout: creates Stripe PaymentIntent from server-side cart totals.
   * POST `/api/stripe/create-payment-intent`
   */
  create: (body) => api.post('/api/stripe/create-payment-intent', body),

  /** Finalizes order after successful payment */
  confirm: (body) => api.post('/api/orders/confirm', body),

  getMyOrders: (params) => api.get('/api/orders/my-orders', { params }),

  getOne: (id) => api.get(`/api/orders/${id}`),

  cancel: (id, body) => api.post(`/api/orders/cancel/${id}`, body || {})
};

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

/**
 * Admin — `/api/admin/*` (JWT + admin role)
 */
export const adminAPI = {
  dashboard: {
    stats: () => api.get('/api/admin/dashboard/stats'),

    revenueChart: (params) =>
      api.get('/api/admin/dashboard/revenue-chart', { params }),

    ordersChart: () => api.get('/api/admin/dashboard/orders-chart')
  },

  products: {
    list: (params) => api.get('/api/products', { params }),

    listAdmin: (params) => api.get('/api/admin/products', { params }),

    pendingApprovals: () => api.get('/api/admin/products/pending'),

    approve: (id) => api.post(`/api/admin/products/${encodeURIComponent(id)}/approve`, {}),

    reject: (id, body) => api.post(`/api/admin/products/${encodeURIComponent(id)}/reject`, body || {}),

    /** Admin edit: Mongo _id, includes drafts */
    getOneForEdit: (id) => api.get(`/api/admin/products/${encodeURIComponent(id)}`),

    bulk: (body) => api.post('/api/admin/products/bulk', body),

    getOne: (idOrSlug) =>
      api.get(`/api/products/${encodeURIComponent(idOrSlug)}`),

    create: (formData) =>
      api.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),

    update: (id, body, options = {}) => {
      const isFd = typeof FormData !== 'undefined' && body instanceof FormData;
      if (isFd || options.asFormData) {
        return api.put(`/api/products/${id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return api.put(`/api/products/${id}`, body);
    },

    updateStock: (id, stock) =>
      api.patch(`/api/products/${id}/stock`, { stock }),

    delete: (id, hard = false) =>
      api.delete(`/api/products/${id}`, hard ? { params: { hard: 'true' } } : undefined)
  },

  staff: {
    list: () => api.get('/api/admin/staff'),
    create: (body) => api.post('/api/admin/staff', body),
    updatePermissions: (id, permissions) =>
      api.put(`/api/admin/staff/${encodeURIComponent(id)}/permissions`, { permissions }),
    block: (id, durationHours) =>
      api.post(`/api/admin/staff/${encodeURIComponent(id)}/block`, { duration: durationHours }),
    unblock: (id) => api.post(`/api/admin/staff/${encodeURIComponent(id)}/unblock`, {}),
    remove: (id) => api.delete(`/api/admin/staff/${encodeURIComponent(id)}`)
  },

  orders: {
    stats: () => api.get('/api/admin/orders/stats'),

    list: (params) => api.get('/api/admin/orders', { params }),

    getOne: (id) => api.get(`/api/admin/orders/${id}`),

    updateStatus: (id, body) =>
      api.put(`/api/admin/orders/${id}/status`, body),

    updateTracking: (id, body) =>
      api.put(`/api/admin/orders/${id}/tracking`, body)
  },

  customers: {
    list: (params) => api.get('/api/admin/customers', { params }),

    getOne: (id) => api.get(`/api/admin/customers/${id}`),

    ban: (id, body) => api.put(`/api/admin/customers/${id}/ban`, body),

    delete: (id) => api.delete(`/api/admin/customers/${id}`)
  },

  coupons: {
    list: () => api.get('/api/admin/coupons'),

    create: (body) => api.post('/api/admin/coupons', body),

    update: (id, body) => api.put(`/api/admin/coupons/${id}`, body),

    toggle: (id) => api.patch(`/api/admin/coupons/${id}/toggle`),

    delete: (id) => api.delete(`/api/admin/coupons/${id}`)
  },

  categories: {
    list: () => api.get('/api/categories'),

    listAll: () => api.get('/api/admin/categories'),

    getBySlug: (slug) =>
      api.get(`/api/categories/${encodeURIComponent(slug)}`),

    reorder: (body) => api.put('/api/categories/reorder', body),

    create: (formData) =>
      api.post('/api/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),

    update: (id, body, options = {}) => {
      const isFd = typeof FormData !== 'undefined' && body instanceof FormData;
      if (isFd || options.asFormData) {
        return api.put(`/api/categories/${id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return api.put(`/api/categories/${id}`, body);
    },

    delete: (id) => api.delete(`/api/categories/${id}`)
  },

  storeSettings: {
    get: () => api.get('/api/admin/store-settings'),

    update: (body) => api.put('/api/admin/store-settings', body)
  },

  fraud: {
    logs: (params) => api.get('/api/admin/fraud/logs', { params }),

    stats: () => api.get('/api/admin/fraud/stats'),

    approveLog: (id, body) =>
      api.put(`/api/admin/fraud/logs/${encodeURIComponent(id)}/approve`, body || {}),

    rejectLog: (id, body) =>
      api.put(`/api/admin/fraud/logs/${encodeURIComponent(id)}/reject`, body || {}),

    blocklist: (params) => api.get('/api/admin/fraud/blocklist', { params }),

    addBlocklist: (body) => api.post('/api/admin/fraud/blocklist', body),

    removeBlocklist: (id) =>
      api.delete(`/api/admin/fraud/blocklist/${encodeURIComponent(id)}`)
  }
};

export default api;
