/**
 * Build-time catalog prerender — injects semantic HTML into #root for SEO.
 * Run after `npm run build`. Requires live API (Railway) or PRERENDER_API_URL.
 */
const fs = require('fs');
const path = require('path');
const config = require('./prerender.config');
const {
  fetchCategories,
  fetchProducts,
  fetchAllProducts,
  fetchProductDetail,
  fetchProductReviews,
  fetchBrands,
  fetchBlogPosts,
  fetchHomeStats,
  fetchPromoTicker,
  mapWithConcurrency
} = require('./lib/prerenderApi');
const {
  buildHomePage,
  buildShopPage,
  buildCategoryPage,
  buildProductPage,
  buildStaticPage,
  buildBlogIndexPage,
  buildBlogPostPage,
  buildBrandsPage,
  buildBrandPage,
  normalizeSlug,
  productPath,
  STATIC_PAGE_CONTENT
} = require('./lib/prerenderTemplates');
const {
  escapeAttr,
  discoverSyncStylesheets,
  injectStaticFallback,
  ensureSyncStylesheets,
  patchHead: patchHeadBase,
  prepareBaseShell
} = require('./lib/prerenderInject');

const BUILD_DIR = path.join(__dirname, '..', 'build');

let SYNC_STYLESHEETS = [];

function fail(msg) {
  console.error(`[prerender] ${msg}`);
  process.exit(1);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function patchHead(html, page) {
  let out = patchHeadBase(html, page);

  const ogPairs = [
    ['og:title', page.title],
    ['og:description', page.description],
    ['og:url', page.canonical],
    ['twitter:title', page.title],
    ['twitter:description', page.description]
  ];

  for (const [prop, value] of ogPairs) {
    const isTwitter = prop.startsWith('twitter:');
    const attr = isTwitter ? 'name' : 'property';
    const re = new RegExp(`<meta ${attr}="${prop}" content="[^"]*"`, 'i');
    const tag = `<meta ${attr}="${prop}" content="${escapeAttr(value)}"`;
    if (re.test(out)) out = out.replace(re, tag);
    else out = out.replace('</head>', `${tag} />\n</head>`);
  }

  out = ensureSyncStylesheets(out, BUILD_DIR);
  return out;
}

function injectRoot(html, rootHtml) {
  return injectStaticFallback(html, rootHtml);
}

function writeRouteHtml(baseShell, routePath, page) {
  const patched = patchHead(injectRoot(baseShell, page.rootHtml), page);
  const outPath =
    routePath === '/'
      ? path.join(BUILD_DIR, 'index.html')
      : path.join(BUILD_DIR, routePath.replace(/^\//, ''), 'index.html');

  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, patched, 'utf8');
  return outPath;
}

function textRatio(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  const textLen = text.replace(/\s+/g, ' ').trim().length;
  const total = html.length || 1;
  return Math.round((textLen / total) * 100);
}

async function main() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    fail('Run npm run build first.');
  }

  const baseShellPath = path.join(BUILD_DIR, 'index.html');
  let baseShell = prepareBaseShell(fs.readFileSync(baseShellPath, 'utf8'));
  SYNC_STYLESHEETS = discoverSyncStylesheets(BUILD_DIR);
  console.log(`[prerender] Sync CSS bundles: ${SYNC_STYLESHEETS.join(', ') || '(none)'}`);
  console.log(`[prerender] API candidates: ${require('./lib/prerenderApi').apiBaseCandidates().join(', ')}`);

  const [categories, brands, blogPosts, homeStats, promoItems] = await Promise.all([
    fetchCategories(),
    fetchBrands(),
    fetchBlogPosts(),
    fetchHomeStats(),
    fetchPromoTicker()
  ]);

  const apiPct = Number(homeStats?.promo?.maxDiscountPercent);
  const maxDiscountPercent =
    Number.isFinite(apiPct) && apiPct > 0 ? Math.round(apiPct) : 40;

  const [homeProducts, shopList] = await Promise.all([
    fetchProducts({ limit: config.homeFeaturedLimit, sort: 'popular' }),
    fetchProducts({ limit: config.productsPerPage, page: 1 })
  ]);

  let allProducts = await fetchAllProducts();
  if (config.maxProducts > 0) allProducts = allProducts.slice(0, config.maxProducts);
  console.log(`[prerender] Catalog: ${categories.length} categories, ${allProducts.length} products, ${brands.length} brands, ${blogPosts.length} blog posts`);

  const routes = [];
  const routeMeta = [];

  function track(routePath, filePath) {
    routes.push(filePath);
    routeMeta.push({
      path: routePath,
      file: path.relative(BUILD_DIR, filePath).replace(/\\/g, '/')
    });
  }

  track(
    '/',
    writeRouteHtml(
      baseShell,
      '/',
      buildHomePage({
        categories,
        products: homeProducts.products,
        maxDiscountPercent,
        promoItems
      })
    )
  );
  track(
    '/shop',
    writeRouteHtml(
      baseShell,
      '/shop',
      buildShopPage({
        categories,
        products: shopList.products,
        totalCount: shopList.totalCount,
        promoItems
      })
    )
  );

  const categorySlice =
    config.maxCategories > 0 ? categories.slice(0, config.maxCategories) : categories;
  for (const category of categorySlice) {
    const slug = normalizeSlug(category.slug || category.name);
    if (!slug) continue;
    const listing = await fetchProducts({ category: slug, limit: config.productsPerPage, page: 1 });
    track(
      `/${slug}`,
      writeRouteHtml(
        baseShell,
        `/${slug}`,
        buildCategoryPage({
          category,
          categories,
          products: listing.products,
          totalCount: listing.totalCount,
          promoItems
        })
      )
    );
  }

  for (const routePath of Object.keys(STATIC_PAGE_CONTENT)) {
    const page = buildStaticPage(routePath);
    if (page) track(routePath, writeRouteHtml(baseShell, routePath, page));
  }

  track('/blog', writeRouteHtml(baseShell, '/blog', buildBlogIndexPage(blogPosts)));
  for (const post of blogPosts) {
    const slug = normalizeSlug(post.slug);
    if (!slug) continue;
    track(`/blog/${slug}`, writeRouteHtml(baseShell, `/blog/${slug}`, buildBlogPostPage(post)));
  }

  track('/brands', writeRouteHtml(baseShell, '/brands', buildBrandsPage(brands)));
  for (const brand of brands) {
    const slug = normalizeSlug(brand.slug);
    if (!slug) continue;
    const listing = await fetchProducts({ brand: slug, limit: config.productsPerPage, page: 1 });
    track(
      `/brand/${slug}`,
      writeRouteHtml(
        baseShell,
        `/brand/${slug}`,
        buildBrandPage({
          brand,
          categories,
          products: listing.products,
          totalCount: listing.totalCount
        })
      )
    );
  }

  let enrichedProducts = allProducts;
  if (config.enrichProductDetails) {
    console.log(`[prerender] Fetching full product descriptions (${allProducts.length} products)…`);
    enrichedProducts = await mapWithConcurrency(
      allProducts,
      config.productFetchConcurrency,
      async (product) => {
        const slug = normalizeSlug(product.slug || product.name);
        if (!slug) return product;
        try {
          const detail = await fetchProductDetail(slug);
          if (!detail) return product;
          return {
            ...product,
            ...detail,
            category: detail.categorySlug || product.category,
            categorySlug: detail.categorySlug || product.category
          };
        } catch {
          return product;
        }
      }
    );
  } else {
    console.log(
      `[prerender] Using catalog list data for ${allProducts.length} product pages (set PRERENDER_ENRICH_PRODUCTS=1 for full descriptions).`
    );
  }

  console.log(`[prerender] Fetching product reviews for JSON-LD (${enrichedProducts.length} products)…`);
  enrichedProducts = await mapWithConcurrency(
    enrichedProducts,
    config.productFetchConcurrency,
    async (product) => {
      const slug = normalizeSlug(product.slug || product.name);
      if (!slug) return product;
      if (Array.isArray(product.reviews) && product.reviews.length >= 2) return product;
      try {
        const reviews = await fetchProductReviews(slug, 5);
        if (reviews.length) return { ...product, reviews };
      } catch {
        /* fake reviews applied at schema build time */
      }
      return product;
    }
  );

  const productPaths = new Set();
  for (const product of enrichedProducts) {
    const routePath = productPath(product);
    if (!routePath || routePath === '/shop' || productPaths.has(routePath)) continue;
    productPaths.add(routePath);
    track(routePath, writeRouteHtml(baseShell, routePath, buildProductPage({ product, categories, promoItems })));
  }

  const homeHtml = fs.readFileSync(routes[0], 'utf8');
  const ratio = textRatio(homeHtml);

  const manifest = {
    generatedAt: new Date().toISOString(),
    apiBase: require('./lib/prerenderApi').getActiveApiBase(),
    siteUrl: config.siteUrl,
    totalPages: routes.length,
    categories: categorySlice.length,
    products: productPaths.size,
    blogs: blogPosts.length,
    brands: brands.length,
    homeTextRatioPercent: ratio,
    routes: routeMeta
  };
  fs.writeFileSync(path.join(BUILD_DIR, 'prerender-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`[prerender] Wrote ${routes.length} HTML files (home text ratio ~${ratio}%).`);
  console.log(`[prerender] Manifest: build/prerender-manifest.json`);
  console.log(`[prerender] API used: ${require('./lib/prerenderApi').getActiveApiBase()}`);
  console.log(`[prerender] Routes: home, shop, ${categorySlice.length} categories, ${productPaths.size} products, ${blogPosts.length} blogs, ${brands.length} brands, static pages.`);
}

main().catch((err) => {
  console.error('[prerender] Failed:', err.message || err);
  process.exit(1);
});
