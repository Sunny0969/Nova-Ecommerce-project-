import axios from 'axios';
import { networkErrorMessage, resolveStoreApiOrigin } from '../config/apiOrigin';

/** Keep in sync with `AuthContext` token storage */
export const TOKEN_KEY = 'nova_shop_token';

/**
 * Production API (Railway) ? see `src/config/apiOrigin.js` and `public/api-config.js`.
 */
export const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = resolveStoreApiOrigin();
    return config;
  },
  (error) => Promise.reject(error)
);

/** Public store pricing (shipping thresholds, tax rate) ? no auth required */
export const storeSettingsAPI = {
  get: () => api.get('/api/store-settings')
};

/** Public homepage metrics ? no auth required */
export const publicAPI = {
  homeStats: () => api.get('/api/public/home-stats'),
  getStripeConfig: () => api.get('/api/public/stripe-config')
};

api.interceptors.request.use(
  (config) => {
    const url = String(config.url || '');
    const isGuestStripe = /\/api\/stripe\/guest\//.test(url);
    const isGuestOrder = /\/api\/orders\/guest\//.test(url);

    if (!isGuestStripe && !isGuestOrder) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

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
        /\/auth\/(login|register|forgot-password|reset-password)(\?|$)/.test(url) ||
        /\/api\/orders\/guest\//.test(url) ||
        /\/api\/stripe\/guest\//.test(url);

      localStorage.removeItem(TOKEN_KEY);
      delete api.defaults.headers.common.Authorization;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nova-auth-expired'));
      }

      if (!skipRedirect && typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const isStorefrontPublic =
          pathname === '/checkout' ||
          pathname === '/cart' ||
          pathname.startsWith('/shop') ||
          pathname.startsWith('/order-confirmation') ||
          pathname === '/' ||
          pathname === '/home';

        if (!isStorefrontPublic && pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Auth G?? `/api/auth/*`
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
 * Products G?? `/api/products/*`
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

export const whatsappChatAPI = {
  status: () => api.get('/api/chat/status'),
  send: (body) => api.post('/api/chat/send-to-whatsapp', body)
};

/**
 * Cart G?? `/api/cart/*` (JWT required on server)
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
 * Orders ? `/api/orders/*` (JWT). Checkout: COD, Easypaisa, or Stripe card.
 */
export const ordersAPI = {
  place: (body) => api.post('/api/orders/place', body),

  guestPlace: (body) => {
    if (body instanceof FormData) {
      return api.post('/api/orders/guest/place', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipAuthRedirect: true
      });
    }
    return api.post('/api/orders/guest/place', body, { skipAuthRedirect: true });
  },

  confirm: (body) => api.post('/api/orders/confirm', body),

  create: (body) => api.post('/api/orders/place', body),

  getMyOrders: (params) => api.get('/api/orders/my-orders', { params }),

  getOne: (id) => api.get(`/api/orders/${id}`, { skipAuthRedirect: true }),

  cancel: (id, body) => api.post(`/api/orders/cancel/${id}`, body || {}),

  uploadPaymentProof: (id, formData) =>
    api.post(`/api/orders/${id}/payment-proof`, formData)
};

/**
 * Wallet — `/api/wallet/*` (JWT). Balance, top-up, checkout preview.
 */
export const walletAPI = {
  getSummary: () => api.get('/api/wallet'),

  getTransactions: (params) => api.get('/api/wallet/transactions', { params }),

  preview: (body) => api.post('/api/wallet/preview', body),

  topUpIntent: (body) => api.post('/api/wallet/top-up/intent', body),

  topUpConfirm: (body) => api.post('/api/wallet/top-up/confirm', body)
};

/**
 * Meta Conversions API mirror — `/api/meta/*` (browser → server, dedup with pixel eventID).
 */
export const metaAPI = {
  trackEvent: (body) => api.post('/api/meta/event', body, { skipAuthRedirect: true }),

  getStatus: () => api.get('/api/meta/status', { skipAuthRedirect: true })
};

/**
 * Stripe ? `/api/stripe/*`
 */
export const stripeAPI = {
  createPaymentIntent: (body) => api.post('/api/stripe/create-payment-intent', body),
  guestCreatePaymentIntent: (body) =>
    api.post('/api/stripe/guest/create-payment-intent', body, { skipAuthRedirect: true }),
  guestConfirm: (body) => api.post('/api/stripe/guest/confirm', body, { skipAuthRedirect: true })
};

/**
 * Wishlist G?? `/api/wishlist/*` (JWT)
 */
export const wishlistAPI = {
  get: () => api.get('/api/wishlist'),

  /**
   * Toggle add/remove G?? POST /api/wishlist/toggle with body (avoids path/proxy 404s).
   * @param {string} productId G?? Mongo _id or slug
   */
  toggle: (productId) =>
    api.post('/api/wishlist/toggle', { productId: String(productId) }),

  clear: () => api.delete('/api/wishlist'),

  remove: (productId) =>
    api.delete(`/api/wishlist/${encodeURIComponent(productId)}`)
};

/**
 * Admin G?? `/api/admin/*` (JWT + admin role)
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
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }),

    update: (id, body, options = {}) => {
      const isFd = typeof FormData !== 'undefined' && body instanceof FormData;
      if (isFd || options.asFormData) {
        return api.put(`/api/products/${id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 0,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
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
    create: (body) => api.post('/api/admin/staff/create', body),
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
      api.put(`/api/admin/orders/${id}/tracking`, body),

    markPaid: (id, body) => api.put(`/api/admin/orders/${id}/paid`, body),

    updatePaymentProof: (id, body) => api.put(`/api/admin/orders/${id}/payment-proof`, body)
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
export { networkErrorMessage };
