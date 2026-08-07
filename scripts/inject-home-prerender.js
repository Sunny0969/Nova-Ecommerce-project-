/**
 * Fast home-page prerender — prevents blank screen when JS is disabled.
 * Runs after craco build (before full catalog prerender in build:hostinger).
 */
const fs = require('fs');
const path = require('path');
const config = require('./prerender.config');
const { fetchCategories, fetchProducts, fetchHomeStats, fetchPromoTicker } = require('./lib/prerenderApi');
const { buildHomePage } = require('./lib/prerenderTemplates');
const {
  injectStaticFallback,
  ensureSyncStylesheets,
  patchHead,
  isHomePrerendered
} = require('./lib/prerenderInject');

const BUILD_DIR = path.join(__dirname, '..', 'build');
const INDEX = path.join(BUILD_DIR, 'index.html');

async function main() {
  if (!fs.existsSync(INDEX)) {
    console.error('[inject-home-prerender] build/index.html missing — run npm run build first.');
    process.exit(1);
  }

  const existing = fs.readFileSync(INDEX, 'utf8');
  if (isHomePrerendered(existing)) {
    console.log('[inject-home-prerender] Home already prerendered — skip.');
    return;
  }

  console.log('[inject-home-prerender] Injecting storefront shell for no-JS visitors…');

  const [categories, homeStats, promoItems] = await Promise.all([
    fetchCategories(),
    fetchHomeStats(),
    fetchPromoTicker()
  ]);

  const apiPct = Number(homeStats?.promo?.maxDiscountPercent);
  const maxDiscountPercent =
    Number.isFinite(apiPct) && apiPct > 0 ? Math.round(apiPct) : 40;

  const homeProducts = await fetchProducts({
    limit: config.homeFeaturedLimit,
    sort: 'popular'
  });

  const page = buildHomePage({
    categories,
    products: homeProducts.products,
    maxDiscountPercent,
    promoItems
  });

  let html = existing;
  html = injectStaticFallback(html, page.rootHtml);
  html = patchHead(html, page);
  html = ensureSyncStylesheets(html, BUILD_DIR);

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log(
    `[inject-home-prerender] OK — home page has navbar + hero + ${homeProducts.products.length} products (no-JS safe).`
  );
}

main().catch((err) => {
  console.error('[inject-home-prerender] Failed:', err.message || err);
  process.exit(1);
});
