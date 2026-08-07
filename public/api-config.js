/* eslint-disable */
/**
 * Runtime API origin — no rebuild needed on Hostinger (edit + hard refresh).
 *
 * localhost / 127.0.0.1  → local backend (http://127.0.0.1:5001)
 * Live domains           → Railway production API
 *
 * SECURITY: Never put secret keys here (MongoDB URI, Stripe sk_, JWT, etc.).
 * Stripe publishable key is fetched from GET /api/public/stripe-config at runtime.
 *
 * Template: see api-config.example.js
 */
(function () {
  var PRODUCTION_API = 'https://nova-ecommerce-project-backend-production.up.railway.app';
  var LOCAL_API = 'http://127.0.0.1:5001';
  var hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  var isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  window.__REACT_APP_API_URL__ = isLocalHost ? LOCAL_API : PRODUCTION_API;
})();
