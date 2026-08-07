/**
 * Verify prerender output exists and key routes have semantic HTML + SEO tags.
 * Run after npm run build:hostinger.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const siteOrigin = 'https://www.bazaar-pk.com';

function fail(msg) {
  console.error(`[verify-prerender] ${msg}`);
  process.exit(1);
}

function readMeta(html, name) {
  const re = new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : '';
}

function readTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function readCanonical(html) {
  const m = html.match(/<link rel="canonical" href="([^"]*)"/i);
  return m ? m[1].trim() : '';
}

function assertPageSeo(html, { label, expectedCanonicalPath, titleIncludes }) {
  const title = readTitle(html);
  const description = readMeta(html, 'description');
  const canonical = readCanonical(html);

  if (!title) fail(`${label}: missing <title>.`);
  if (!description) fail(`${label}: missing meta description.`);
  if (!canonical) fail(`${label}: missing canonical link.`);

  const expectedCanonical = `${siteOrigin}${expectedCanonicalPath.startsWith('/') ? expectedCanonicalPath : `/${expectedCanonicalPath}`}`;
  if (canonical !== expectedCanonical) {
    fail(`${label}: canonical is "${canonical}" — expected "${expectedCanonical}".`);
  }
  if (titleIncludes && !title.includes(titleIncludes)) {
    fail(`${label}: title "${title}" does not include "${titleIncludes}".`);
  }
}

function assertAbsoluteAssets(html, label) {
  if (/href="\.\/static\//i.test(html) || /src="\.\/static\//i.test(html)) {
    fail(`${label}: relative ./static/ asset paths found — use absolute /static/ (add <base href="/">).`);
  }
  if (!html.includes('<base href="/"')) {
    fail(`${label}: missing <base href="/" /> — subfolder pages may break JS/CSS on Hostinger.`);
  }
  if (!html.includes('data-prerender-sync-css') && !html.includes('rel="stylesheet" href="/static/css/main')) {
    fail(`${label}: missing synchronous main.css link for no-JS visitors.`);
  }
}

const indexPath = path.join(buildDir, 'index.html');
const shopPath = path.join(buildDir, 'shop', 'index.html');
const manifestPath = path.join(buildDir, 'prerender-manifest.json');
const htaccessPath = path.join(buildDir, '.htaccess');

if (!fs.existsSync(indexPath)) fail('build/index.html missing.');

const home = fs.readFileSync(indexPath, 'utf8');
if (!home.includes('id="static-fallback"') || !home.includes('data-prerender="catalog"')) {
  fail('Home page missing #static-fallback prerender shell — run npm run build:hostinger.');
}
if (!home.includes('<div id="root"></div>')) {
  fail('Home page #root must stay empty for React mount (prerender lives in #static-fallback).');
}
if (!home.includes('rozana-hero') || !home.includes('class="navbar"')) {
  fail('Prerendered home HTML is missing storefront shell (navbar / hero).');
}
if (!home.includes('products-grid')) {
  fail('Prerendered home HTML is missing product grid.');
}

assertAbsoluteAssets(home, 'home');
assertPageSeo(home, { label: 'home', expectedCanonicalPath: '/', titleIncludes: 'Bazaar' });

if (!fs.existsSync(shopPath)) fail('build/shop/index.html missing.');

if (!fs.existsSync(manifestPath)) fail('build/prerender-manifest.json missing.');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (!manifest.totalPages || manifest.totalPages < 10) {
  fail(`Prerender manifest reports only ${manifest.totalPages || 0} pages — expected many more.`);
}

const checks = [
  ['about-us', path.join(buildDir, 'about-us', 'index.html'), '/about-us'],
  ['blog', path.join(buildDir, 'blog', 'index.html'), '/blog'],
  ['brands', path.join(buildDir, 'brands', 'index.html'), '/brands'],
  ['shop', shopPath, '/shop']
];

for (const [label, filePath, canonicalPath] of checks) {
  if (!fs.existsSync(filePath)) fail(`build/${label}/index.html missing.`);
  const html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('data-prerender="catalog"')) fail(`build/${label}/index.html not prerendered.`);
  assertAbsoluteAssets(html, label);
  assertPageSeo(html, { label, expectedCanonicalPath: canonicalPath });
}

if (fs.existsSync(htaccessPath)) {
  const htaccess = fs.readFileSync(htaccessPath, 'utf8');
  if (!htaccess.includes('PRERENDER-FIRST') || !htaccess.includes('REQUEST_FILENAME}/index.html')) {
    fail('build/.htaccess missing PRERENDER-FIRST rules.');
  }
  if (!htaccess.includes('mod_expires') || !htaccess.includes('text/html')) {
    fail('build/.htaccess missing mod_expires HTML no-cache rules for LiteSpeed/Hostinger.');
  }
} else {
  fail('build/.htaccess missing.');
}

const SKIP_WALK_DIRS = new Set(['static', 'fonts', 'images']);

function isProductDetailHtml(html) {
  if (!html.includes('data-prerender="catalog"')) return false;
  return (
    html.includes('prerender-product-detail product-detail-page') ||
    html.includes('product-detail-page__title')
  );
}

/** Prefer manifest — reliable on Windows (avoids full-tree walk). */
function findSampleProductFromManifest(manifest) {
  for (const route of manifest.routes || []) {
    const parts = String(route.path || '')
      .split('/')
      .filter(Boolean);
    if (parts.length !== 2) continue;
    const [segment] = parts;
    if (segment === 'brand' || segment === 'blog' || segment === 'shop') continue;

    const filePath = path.join(buildDir, String(route.file || '').replace(/\//g, path.sep));
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf8');
    if (isProductDetailHtml(html)) return filePath;
  }
  return null;
}

function findSampleProductPage(dir) {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (SKIP_WALK_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    const nested = path.join(full, 'index.html');
    if (fs.existsSync(nested)) {
      const html = fs.readFileSync(nested, 'utf8');
      if (isProductDetailHtml(html)) return nested;
    }

    const deeper = findSampleProductPage(full);
    if (deeper) return deeper;
  }
  return null;
}

function assertProductSchema(html) {
  const hasJsonLdProduct =
    html.includes('application/ld+json') &&
    (html.includes('"@type":"Product"') || html.includes('"@type": "Product"'));
  const hasMicrodataProduct = html.includes('itemtype="https://schema.org/Product"');
  if (!hasJsonLdProduct && !hasMicrodataProduct) {
    fail('Product sample missing Product schema (JSON-LD or microdata).');
  }

  const hasRating =
    html.includes('"aggregateRating"') || html.includes('itemprop="aggregateRating"');
  const hasAvailability =
    html.includes('"availability"') || html.includes('itemprop="availability"');
  const hasBrand = html.includes('"brand"') || html.includes('itemprop="brand"');
  const hasSku = html.includes('"sku"') || html.includes('itemprop="sku"');

  if (!hasRating) fail('Product sample missing aggregateRating (JSON-LD or microdata).');
  if (!hasAvailability) fail('Product sample missing offer availability.');
  if (!hasBrand) fail('Product sample missing brand.');
  if (!hasSku) fail('Product sample missing sku.');
}

let sampleProduct = findSampleProductFromManifest(manifest);
if (!sampleProduct) sampleProduct = findSampleProductPage(buildDir);
if (!sampleProduct) {
  fail(
    'No prerendered product detail page found under build/. ' +
      `Manifest reports ${manifest.products || 0} products — re-run npm run build:hostinger.`
  );
}

const sampleHtml = fs.readFileSync(sampleProduct, 'utf8');
const relProduct = path.relative(buildDir, sampleProduct).replace(/\\/g, '/').replace(/\/index\.html$/, '');
const expectedProductCanonical = `${siteOrigin}/${relProduct}`;

assertAbsoluteAssets(sampleHtml, 'product sample');
assertPageSeo(sampleHtml, {
  label: 'product sample',
  expectedCanonicalPath: `/${relProduct}`,
  titleIncludes: 'Bazaar'
});

if (readCanonical(sampleHtml) !== expectedProductCanonical) {
  fail(`Product canonical mismatch for ${relProduct}.`);
}

assertProductSchema(sampleHtml);

function countPrerenderFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countPrerenderFiles(full);
    else if (entry.name === 'index.html') {
      const html = fs.readFileSync(full, 'utf8');
      if (html.includes('data-prerender="catalog"')) count += 1;
    }
  }
  return count;
}

const prerenderCount = countPrerenderFiles(buildDir);
if (Math.abs(prerenderCount - manifest.totalPages) > 2) {
  console.warn(
    `[verify-prerender] Warning: filesystem count (${prerenderCount}) != manifest.totalPages (${manifest.totalPages}).`
  );
}

console.log(
  `[verify-prerender] OK — ${prerenderCount} prerendered pages; SEO tags + absolute assets verified; ` +
    `sample product: ${path.relative(buildDir, sampleProduct)}`
);
console.log(
  '[verify-prerender] Deploy: upload build/ to Hostinger, then purge LiteSpeed Cache in hPanel.'
);
