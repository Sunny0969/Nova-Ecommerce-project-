/* eslint-disable */
/**
 * Runtime API origin — no rebuild needed on Hostinger (edit + hard refresh).
 *
 * localhost / 127.0.0.1  → local backend (http://127.0.0.1:5001)
 * bazaar-pk.com & live   → Railway production API (unchanged)
 *
 * Local backend needs catalog data once:  cd backend && npm run sync:production
 */
(function () {
  var PRODUCTION_API = 'https://nova-ecommerce-project-backend-production.up.railway.app';
  var LOCAL_API = 'http://127.0.0.1:5001';
  var hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  var isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  window.__REACT_APP_API_URL__ = isLocalHost ? LOCAL_API : PRODUCTION_API;

  window.__REACT_APP_STRIPE_PUBLISHABLE_KEY__ =
    'pk_live_51SFxJDLH9YcwsuZNRH4HeyGDo5PiS75Vn7xpBvb84rLtejmXubttXsbxvV7AI4vJH5IVJCNhFqSvCBgpcimjmW8b00QzU5SI9U';
})();
