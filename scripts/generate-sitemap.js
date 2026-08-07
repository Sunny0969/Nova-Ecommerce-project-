/**
 * Build-time sitemap for Hostinger static deploy (uses live catalog API).
 * Run after prerender: node scripts/generate-sitemap.js
 */
const fs = require('fs');
const path = require('path');
const config = require('./prerender.config');
const {
  fetchAllProducts,
  fetchCategories,
  fetchBrands,
  fetchBlogPosts,
  getActiveApiBase
} = require('./lib/prerenderApi');
const {
  buildSitemapEntriesFromCatalog,
  renderSitemapXml,
  renderSitemapIndexXml,
  buildSitemapChunks,
  buildSitemapIndexEntries,
  MAX_URLS_PER_SITEMAP
} = require('../../backend/lib/sitemapBuilder');

async function writeSitemapBundle(dir, siteUrl, entries) {
  fs.mkdirSync(dir, { recursive: true });

  if (entries.length <= MAX_URLS_PER_SITEMAP) {
    fs.writeFileSync(path.join(dir, 'sitemap.xml'), renderSitemapXml(entries), 'utf8');
    return ['sitemap.xml'];
  }

  const chunks = buildSitemapChunks(siteUrl, entries);
  const indexXml = renderSitemapIndexXml(
    buildSitemapIndexEntries(
      siteUrl,
      chunks.map((c) => c.filename)
    )
  );
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), indexXml, 'utf8');
  for (const chunk of chunks) {
    fs.writeFileSync(path.join(dir, chunk.filename), renderSitemapXml(chunk.entries), 'utf8');
  }
  return ['sitemap.xml', ...chunks.map((c) => c.filename)];
}

async function main() {
  const siteUrl = config.siteUrl;
  console.log(`[sitemap] Fetching catalog from API for ${siteUrl}…`);

  const [products, categories, brands, blogPosts] = await Promise.all([
    fetchAllProducts(),
    fetchCategories(),
    fetchBrands(),
    fetchBlogPosts()
  ]);

  const entries = buildSitemapEntriesFromCatalog(siteUrl, {
    products,
    categories,
    brands: (brands || []).filter((b) => b.isActive !== false),
    blogPosts: (blogPosts || []).filter((p) => p.status !== 'draft')
  });

  const outputs = [
    path.join(__dirname, '..', 'build'),
    path.join(__dirname, '..', 'public')
  ];

  const written = new Set();
  for (const dir of outputs) {
    const files = await writeSitemapBundle(dir, siteUrl, entries);
    files.forEach((f) => written.add(f));
    console.log(`[sitemap] Wrote ${entries.length} URLs → ${dir}/${files.join(', ')}`);
  }

  console.log(`[sitemap] API used: ${getActiveApiBase()}`);
  console.log(`[sitemap] Done — ${entries.length} unique URLs in sitemap.`);
}

main().catch((err) => {
  console.error('[sitemap] Failed:', err.message || err);
  process.exit(1);
});
