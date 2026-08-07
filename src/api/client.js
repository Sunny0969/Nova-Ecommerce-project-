import axios from 'axios';
import { networkErrorMessage, resolveStoreApiOrigin, isLocalDevHost } from '../config/apiOrigin';

/** Keep in sync with `AuthContext` token storage */
export const TOKEN_KEY = 'nova_shop_token';

/**
 * Production API (Railway) — see `src/config/apiOrigin.js` and `public/api-config.js`.
 */
const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = resolveStoreApiOrigin();

    // Local dev: skip browser HTTP cache (304 stale responses)
    if (typeof window !== 'undefined' && isLocalDevHost()) {
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
      if (String(config.method || 'get').toLowerCase() === 'get') {
        config.params = { ...config.params, _t: Date.now() };
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.request.use(
  (config) => {
    const url = String(config.url || '');
    const skipAuth =
      /\/api\/stripe\/guest\//.test(url) ||
      /\/api\/orders\/guest\//.test(url) ||
      /\/api\/public\/validate-coupon/.test(url);

    if (!skipAuth) {
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
      if (config.headers.post) {
        delete config.headers.post['Content-Type'];
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
        /\/api\/stripe\/guest\//.test(url) ||
        /\/api\/public\/validate-coupon/.test(url) ||
        /\/api\/notifications\//.test(url);

      if (!skipRedirect) {
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common.Authorization;

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nova-auth-expired'));
        }

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

export default api;
export { networkErrorMessage };
