/**
 * Fail the build if Hostinger deploy artifacts are missing or misconfigured.
 */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const required = ['index.html', '404.html', 'api-config.js', '.htaccess', 'robots.txt', 'sitemap.xml', 'prerender-manifest.json', 'static'];
const railway = 'nova-ecommerce-project-backend-production.up.railway.app';

function fail(msg) {
  console.error(`[verify-hostinger-build] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(buildDir)) {
  fail('build/ folder not found — run npm run build first.');
}

for (const name of required) {
  const p = path.join(buildDir, name);
  if (!fs.existsSync(p)) {
    fail(`Missing ${name} in build/ — upload this to Hostinger public_html.`);
  }
}

const indexHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
if (!indexHtml.includes('id="static-fallback"') || !indexHtml.includes('data-prerender="catalog"')) {
  fail('index.html is not prerendered — run npm run build:hostinger before uploading to Hostinger.');
}
if (!indexHtml.includes('<base href="/"')) {
  fail('index.html missing <base href="/" /> — nested prerender routes may load broken asset paths.');
}
if (!indexHtml.includes('src="/static/js/')) {
  fail('index.html must use absolute /static/js/ paths (not relative ./static/).');
}
if (!indexHtml.includes(railway)) {
  fail('index.html does not reference the Railway API — live site will fail to load data.');
}

const apiConfig = fs.readFileSync(path.join(buildDir, 'api-config.js'), 'utf8');
if (!apiConfig.includes(railway)) {
  fail('api-config.js does not point to Railway.');
}

const htaccess = fs.readFileSync(path.join(buildDir, '.htaccess'), 'utf8');
if (!htaccess.includes('mod_expires') || !htaccess.includes('text/html')) {
  fail('.htaccess missing mod_expires no-cache for HTML — LiteSpeed may serve stale prerender after deploy.');
}

if (!htaccess.includes('max-age=31536000') || !htaccess.includes('immutable')) {
  fail('.htaccess missing 1-year immutable Cache-Control for static assets.');
}

if (!htaccess.includes('mod_deflate')) {
  fail('.htaccess missing mod_deflate — enable gzip for HTML/CSS/JS on Hostinger Apache.');
}

if (!htaccess.includes('RewriteEngine On') || !htaccess.includes('index.html')) {
  fail(
    '.htaccess missing SPA fallback (RewriteRule → index.html). ' +
      'Direct URLs like /blog will 404 on Hostinger without it.'
  );
}

if (!htaccess.includes('PRERENDER-FIRST') || !htaccess.includes('REQUEST_FILENAME}/index.html')) {
  fail(
    '.htaccess missing PRERENDER-FIRST rules. ' +
      'Hostinger will serve empty SPA shell instead of build-time HTML for catalog URLs.'
  );
}

if (!htaccess.includes('ErrorDocument 404')) {
  fail('.htaccess missing ErrorDocument 404 — Hostinger fallback for direct URLs.');
}

const fallback404 = fs.readFileSync(path.join(buildDir, '404.html'), 'utf8');
if (!fallback404.includes('id="root"') || !fallback404.includes('/static/js/')) {
  fail('404.html must be a copy of index.html (React bootstrap) for Hostinger error-page fallback.');
}

const robots = fs.readFileSync(path.join(buildDir, 'robots.txt'), 'utf8');
if (robots.includes('Disallow: /static/js/') || robots.includes('Disallow: /static/css/')) {
  fail('robots.txt must NOT block /static/js/ or /static/css/ — Google needs them to render SPA pages.');
}
if (!robots.includes('Sitemap: https://www.bazaar-pk.com/sitemap.xml')) {
  fail('robots.txt must include Sitemap: https://www.bazaar-pk.com/sitemap.xml');
}

const sitemap = fs.readFileSync(path.join(buildDir, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('<urlset') && !sitemap.includes('<sitemapindex')) {
  fail('sitemap.xml is missing valid <urlset> or <sitemapindex> root element.');
}
if (sitemap.includes('<urlset') && !sitemap.includes('<loc>https://www.bazaar-pk.com/')) {
  fail('sitemap.xml must include absolute https://www.bazaar-pk.com/ URLs.');
}

console.log(
  '[verify-hostinger-build] OK — ready to upload build/ to Hostinger. ' +
    'Tip: in hPanel enable Cache Manager / LiteSpeed cache for static assets.'
);
