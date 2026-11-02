/* eslint-disable */
/**
 * Copy to `public/api-config.js` on Hostinger if you need to override the API URL.
 * Do NOT put Stripe secret keys here — only the production API origin.
 * Stripe publishable key is loaded at runtime from GET /api/public/stripe-config.
 */
(function () {
  // var PRODUCTION_API = 'https://YOUR-RAILWAY-BACKEND.up.railway.app'; // Railway (old)
  var PRODUCTION_API = 'https://nova-ecommerce-project-backend.onrender.com';
  var LOCAL_API = 'http://127.0.0.1:5001';
  var hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  var isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  window.__REACT_APP_API_URL__ = isLocalHost ? LOCAL_API : PRODUCTION_API;
})();
