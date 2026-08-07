/**
 * Register the push service worker once per browser session.
 */
const SW_PATH = process.env.REACT_APP_SERVICE_WORKER_PATH || '/service-worker.js';

let registrationPromise = null;

export function isServiceWorkerSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export function registerServiceWorker() {
  if (!isServiceWorkerSupported()) {
    return Promise.resolve(null);
  }
  if (registrationPromise) {
    return registrationPromise;
  }

  registrationPromise = navigator.serviceWorker
    .register(SW_PATH, { scope: '/' })
    .then((reg) => {
      if (process.env.NODE_ENV === 'development') {
        console.info('[push] service worker registered', reg.scope);
      }
      return reg;
    })
    .catch((err) => {
      console.warn('[push] service worker registration failed:', err.message);
      registrationPromise = null;
      return null;
    });

  return registrationPromise;
}

export function getServiceWorkerRegistration() {
  if (!isServiceWorkerSupported()) return Promise.resolve(null);
  if (registrationPromise) return registrationPromise;
  return navigator.serviceWorker.getRegistration(SW_PATH).then((reg) => reg || null);
}
