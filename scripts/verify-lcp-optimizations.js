/**
 * Fail Hostinger deploy if core Web Vitals head optimizations are missing from build/index.html.
 */
const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'build', 'index.html');

function fail(msg) {
  console.error(`[verify-lcp-optimizations] ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  fail('build/index.html not found — run npm run build first.');
}

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

if (!indexHtml.includes('api-config.js" defer')) {
  fail('api-config.js must use defer to avoid render-blocking.');
}

if (!indexHtml.includes('rel="preload" href="/fonts/')) {
  fail('Font woff2 assets must be preloaded in <head>.');
}

if (!indexHtml.includes('rel="preload"') || !indexHtml.includes('as="image"')) {
  fail('LCP banner image preload is missing from <head>.');
}

if (!indexHtml.includes('as="style"') || !indexHtml.includes("onload=\"this.onload=null;this.rel='stylesheet'\"")) {
  fail('CSS (main + fonts) must load asynchronously via preload + onload stylesheet pattern.');
}

if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(indexHtml)) {
  fail('Remove Google Fonts CDN links — use self-hosted /fonts/fonts.css with font-display: swap.');
}

const cloudinaryPreconnect =
  indexHtml.includes('href="https://res.cloudinary.com"') &&
  /href="https:\/\/res\.cloudinary\.com"[^>]*crossorigin/i.test(indexHtml);
if (indexHtml.includes('href="https://res.cloudinary.com"') && !cloudinaryPreconnect) {
  fail('Preconnect for res.cloudinary.com must include crossorigin.');
}

if (/href="https:\/\/nova-ecommerce-project-backend-production\.up\.railway\.app"[^>]*crossorigin/i.test(indexHtml)) {
  fail('Railway API preconnect must NOT use crossorigin (same-origin API fetch).');
}

console.log('[verify-lcp-optimizations] OK — LCP, fonts, CSS, and preconnect checks passed.');
