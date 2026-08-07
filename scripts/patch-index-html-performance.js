/**
 * Post-build: unblock render (async CSS, defer config) + early LCP banner preload.
 * Run after `craco build`, before prerender.
 */
const fs = require('fs');
const path = require('path');
const { discoverSyncStylesheets, ensureSyncStylesheets } = require('./lib/prerenderInject');

const BUILD_INDEX = path.join(__dirname, '..', 'build', 'index.html');
const bannerCloudinary = require('../src/config/homeBannerCloudinary.json');

function fail(msg) {
  console.error(`[patch-index-html-performance] ${msg}`);
  process.exit(1);
}

function lcpBannerPreloadHref() {
  const cloud = String(process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'db05hw4ri').trim();
  const first = bannerCloudinary['summer-sale'];
  const publicId = first?.public_id;
  if (publicId && cloud) {
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_600/${publicId}`;
  }
  return first?.url || null;
}

function patchStylesheets(html) {
  const asyncCss =
    '<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n<noscript><link rel="stylesheet" href="$1"></noscript>';

  let out = html.replace(
    /<link href="(\/static\/css\/[^"]+\.css)" rel="stylesheet"\s*\/?>/g,
    (_, href) => asyncCss.replace(/\$1/g, href)
  );

  const mainCss = out.match(/href="(\/static\/css\/main[^"]+\.css)"/);
  if (mainCss && !out.includes('data-prerender-sync-css')) {
    out = out.replace(
      '</head>',
      `    <link rel="stylesheet" href="${mainCss[1]}" data-prerender-sync-css="1" />\n  </head>`
    );
  }

  /* Keep fonts.css synchronous — async breaks Taskor logo on live (Playfair fallback) */

  return out;
}

function ensureLcpPreload(html, href) {
  if (!href || html.includes(href)) return html;
  const tag = `<link rel="preload" fetchpriority="high" as="image" href="${href}" />`;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function ensureFontPreloads(html) {
  const fonts = [
    '/fonts/dm-sans/dm-sans-latin-500-normal.woff2',
    '/fonts/playfair-display/playfair-display-latin-700-normal.woff2',
    '/fonts/playfair-display/playfair-display-latin-900-normal.woff2',
    '/fonts/taskor/taskor-regular.woff2'
  ];

  let out = html;
  for (const href of fonts) {
    if (out.includes(`href="${href}"`)) continue;
    out = out.replace(
      '</head>',
      `    <link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin="anonymous" />\n  </head>`
    );
  }
  return out;
}

function ensureApiConfigDefer(html) {
  return html
    .replace(/<script src="(\/api-config\.js)"(?![^>]*\bdefer\b)[^>]*><\/script>/i, '<script src="$1" defer></script>')
    .replace(/<script src="(\/api-config\.js)" defer defer><\/script>/i, '<script src="$1" defer></script>');
}

function fixPreconnectOrigins(html) {
  return html.replace(
    /<link rel="preconnect" href="https:\/\/nova-ecommerce-project-backend-production\.up\.railway\.app"\s*crossorigin\s*\/?>/gi,
    '<link rel="preconnect" href="https://nova-ecommerce-project-backend-production.up.railway.app" />'
  );
}

function ensureBaseHref(html) {
  if (/<base\s[^>]*href=/i.test(html)) return html;
  return html.replace(/<head>/i, '<head>\n    <base href="/" />');
}

function main() {
  if (!fs.existsSync(BUILD_INDEX)) {
    fail('build/index.html not found — run npm run build first.');
  }

  let html = fs.readFileSync(BUILD_INDEX, 'utf8');
  html = ensureBaseHref(html);
  html = ensureApiConfigDefer(html);
  html = fixPreconnectOrigins(html);
  html = patchStylesheets(html);
  html = ensureLcpPreload(html, lcpBannerPreloadHref());
  html = ensureFontPreloads(html);
  html = ensureSyncStylesheets(html, path.join(__dirname, '..', 'build'));

  fs.writeFileSync(BUILD_INDEX, html, 'utf8');
  console.log('[patch-index-html-performance] OK — async CSS/fonts, LCP preload, font preloads applied.');
}

main();
