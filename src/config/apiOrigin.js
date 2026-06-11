/**
 * Production API origin (Railway).
 * Hostinger: override anytime in `public/api-config.js` without rebuild.
 */
export const DEFAULT_PRODUCTION_API_ORIGIN =
  'https://nova-ecommerce-project-backend-production.up.railway.app';

export function normalizeApiOrigin(url) {
  if (url == null || url === '') return '';
  let u = String(url).trim().replace(/\/$/, '');
  if (u.endsWith('/api')) u = u.slice(0, -4);
  return u;
}

/** True when the storefront is opened on a developer machine. */
export function isLocalDevHost(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1';
}

export function resolveProductionApiOrigin() {
  if (typeof window !== 'undefined' && window.__REACT_APP_API_URL__) {
    return String(window.__REACT_APP_API_URL__).trim();
  }
  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim();
  }
  return DEFAULT_PRODUCTION_API_ORIGIN;
}

/**
 * Single source of truth for storefront + staff API base URL.
 * Live domains always use Railway — never localhost — even if api-config.js is missing.
 */
export function resolveStoreApiOrigin() {
  if (typeof window !== 'undefined' && window.__REACT_APP_API_URL__) {
    const fromWindow = normalizeApiOrigin(window.__REACT_APP_API_URL__);
    if (fromWindow) return fromWindow;
  }

  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return normalizeApiOrigin(fromEnv);
  }

  if (typeof window !== 'undefined' && !isLocalDevHost()) {
    return normalizeApiOrigin(DEFAULT_PRODUCTION_API_ORIGIN);
  }

  if (process.env.NODE_ENV === 'production') {
    return normalizeApiOrigin(DEFAULT_PRODUCTION_API_ORIGIN);
  }

  return 'http://127.0.0.1:5001';
}

/** User-facing message when axios network calls fail. */
export function networkErrorMessage() {
  if (typeof window !== 'undefined' && isLocalDevHost()) {
    return 'Cannot reach the API. Start the backend: cd backend && npm start';
  }
  return 'Cannot reach the store API right now. Please refresh the page or try again shortly.';
}
