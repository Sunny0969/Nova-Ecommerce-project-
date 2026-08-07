/**
 * Warm high-traffic storefront route chunks during idle time — smoother first clicks.
 */
let started = false;

export function prefetchStorefrontRoutes() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const run = () => {
    void import(/* webpackChunkName: "storefront-app" */ '../routes/StorefrontAppRoutes');
    void import(/* webpackChunkName: "home" */ '../pages/Home');
    void import(/* webpackChunkName: "product-detail" */ '../pages/ProductDetail');
    void import(/* webpackChunkName: "shop" */ '../pages/Products');
    void import(/* webpackChunkName: "catalog-routes" */ '../pages/CatalogRoutes');
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 400);
  }
}
