/**
 * Dev/crawl fallback — cache semantic HTML per route for npm start (no-JS / crawlers).
 * Writes scripts/.crawl-cache.json (gitignored via .gitignore entry).
 */
const fs = require('fs');
const path = require('path');
const { fetchCategories, fetchProducts } = require('./lib/prerenderApi');
const {
  buildHomePage,
  buildShopPage,
  buildCategoryPage,
  normalizeSlug
} = require('./lib/prerenderTemplates');

const OUT = path.join(__dirname, '.crawl-cache.json');

async function main() {
  const categories = await fetchCategories();
  const [homeProducts, shopList] = await Promise.all([
    fetchProducts({ limit: 24, sort: 'popular' }),
    fetchProducts({ limit: 48, page: 1 })
  ]);

  const routes = {
    '/': buildHomePage({ categories, products: homeProducts.products }),
    '/shop': buildShopPage({
      categories,
      products: shopList.products,
      totalCount: shopList.totalCount
    })
  };

  for (const category of categories.slice(0, 12)) {
    const slug = normalizeSlug(category.slug || category.name);
    if (!slug) continue;
    const listing = await fetchProducts({ category: slug, limit: 24, page: 1 });
    routes[`/${slug}`] = buildCategoryPage({
      category,
      categories,
      products: listing.products,
      totalCount: listing.totalCount
    });
  }

  fs.writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), routes }, null, 0),
    'utf8'
  );

  console.log(
    `[crawl-cache] Wrote ${Object.keys(routes).length} routes → ${path.relative(process.cwd(), OUT)}`
  );
}

main().catch((err) => {
  console.warn('[crawl-cache] Skipped:', err.message || err);
  process.exit(0);
});
