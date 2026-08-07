/**
 * Shared HTML injection helpers for prerender + quick home fallback.
 */
const fs = require('fs');
const path = require('path');

const PRERENDER_CSS = `<style id="prerender-catalog-css">
.prerender-catalog{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a2e;background:#fff7f0;line-height:1.5}
.prerender-page{max-width:72rem;margin:0 auto;padding:1rem 1rem 2.5rem}
.prerender-page__title{font-size:clamp(1.5rem,2.5vw,2rem);margin:0 0 .5rem;color:#1a1a2e}
.prerender-page__lede{margin:0 0 1.25rem;color:#5c5c6e;max-width:42rem}
.prerender-categories{margin:0 0 1.5rem;padding:1rem;background:#fff;border:1px solid #e8e2d8;border-radius:.75rem}
.prerender-categories__title{font-size:1rem;margin:0 0 .75rem}
.prerender-categories__list{display:flex;flex-wrap:wrap;gap:.5rem 1rem;margin:0;padding:0;list-style:none}
.prerender-categories__list a{color:#1a1a2e;text-decoration:none;font-weight:600}
.prerender-categories__list a[aria-current="page"]{color:#f97316}
.prerender-products__title{font-size:1.125rem;margin:0 0 .75rem}
.prerender-product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.5rem,1fr));gap:.75rem;margin:0;padding:0;list-style:none}
.prerender-product-card{background:#fff;border:1px solid #e8e2d8;border-radius:.75rem;overflow:hidden;height:100%}
.prerender-product-card__link{display:flex;flex-direction:column;height:100%;padding:.65rem;color:inherit;text-decoration:none}
.prerender-product-card__img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:.5rem;background:#f5efe6}
.prerender-product-card__name{font-size:.95rem;margin:.5rem 0 .25rem;line-height:1.3}
.prerender-product-card__desc{font-size:.78rem;color:#5c5c6e;margin:0 0 .35rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prerender-product-card__price{margin:0;font-weight:700;color:#f97316}
.prerender-site-nav{margin:0 0 1.25rem;padding:.75rem 1rem;background:#fff;border:1px solid #e8e2d8;border-radius:.75rem}
.prerender-site-nav ul{display:flex;flex-wrap:wrap;gap:.35rem 1rem;margin:0;padding:0;list-style:none}
.prerender-site-nav a{color:#1a1a2e;font-weight:600;text-decoration:none}
.prerender-product-detail__img{width:min(100%,22rem);aspect-ratio:1/1;object-fit:cover;border-radius:.75rem;border:1px solid #e8e2d8;background:#f5efe6}
.prerender-product-detail__price{font-size:1.25rem;font-weight:700;color:#f97316;margin:.5rem 0}
.prerender-product-detail__rating{margin:.35rem 0 .5rem;font-size:.95rem;color:#1a1a2e}
.prerender-product-detail__rating span{color:#5c5c6e;font-weight:500}
.prerender-product-detail__desc{margin:1rem 0;line-height:1.65;color:#3d3d4e;white-space:pre-wrap}
.prerender-blog-list,.prerender-brand-list{margin:0;padding:0;list-style:none;display:grid;gap:.75rem}
.prerender-blog-card,.prerender-brand-card{background:#fff;border:1px solid #e8e2d8;border-radius:.75rem;padding:.85rem}
.prerender-blog-card a,.prerender-brand-card a{color:#1a1a2e;text-decoration:none;font-weight:600}
.prerender-static-body{margin:0;line-height:1.65;color:#3d3d4e}
.prerender-static-body p{margin:0 0 .75rem}
#static-fallback[data-prerender="catalog"]:not([hidden]){min-height:100vh;background:var(--cream,#fff7f0)}
html.js #static-fallback[data-prerender="catalog"]:not([hidden]){position:fixed;inset:0;z-index:10000;overflow-y:auto}
body.prerender-fallback-hidden #static-fallback{display:none!important}
</style>`;

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function discoverSyncStylesheets(buildDir) {
  const cssDir = path.join(buildDir, 'static', 'css');
  if (!fs.existsSync(cssDir)) return [];
  const files = fs.readdirSync(cssDir);
  const pick = (prefix) => files.find((f) => f.startsWith(prefix) && f.endsWith('.css'));
  const hrefs = [];
  for (const prefix of ['main.', 'home.', 'shop.', 'product-detail.', '873.']) {
    const file = pick(prefix);
    if (file) hrefs.push(`/static/css/${file}`);
  }
  return [...new Set(hrefs)];
}

function clearStaticFallback(html) {
  const start = html.indexOf('<div id="static-fallback"');
  if (start === -1) return html;
  const rootStart = html.indexOf('<div id="root"', start);
  if (rootStart === -1) return html;
  return `${html.slice(0, start)}<div id="static-fallback"></div>\n    ${html.slice(rootStart)}`;
}

function injectStaticFallback(html, catalogHtml) {
  const block = `<div id="static-fallback" data-prerender="catalog">${catalogHtml}</div>`;
  let out = html;

  if (out.includes('<div id="static-fallback"></div>')) {
    out = out.replace('<div id="static-fallback"></div>', block);
  } else if (out.includes('id="static-fallback"')) {
    out = clearStaticFallback(out).replace('<div id="static-fallback"></div>', block);
  } else {
    out = out.replace('<div id="root"></div>', `${block}\n    <div id="root"></div>`);
  }

  const rootStart = out.indexOf('<div id="root"');
  const bodyEnd = out.indexOf('</body>', rootStart);
  if (rootStart !== -1 && bodyEnd !== -1) {
    const before = out.slice(0, rootStart);
    const after = out.slice(bodyEnd);
    out = `${before}<div id="root"></div>${after}`;
  }

  return out;
}

function ensureSyncStylesheets(html, buildDir) {
  const hrefs = discoverSyncStylesheets(buildDir);
  let out = html;
  for (const href of hrefs) {
    if (out.includes(href)) continue;
    out = out.replace('</head>', `    <link rel="stylesheet" href="${escapeAttr(href)}" data-prerender-sync-css="1" />\n  </head>`);
    if (!out.includes(`<noscript><link rel="stylesheet" href="${href}"`)) {
      out = out.replace(
        '</head>',
        `    <noscript><link rel="stylesheet" href="${escapeAttr(href)}" /></noscript>\n  </head>`
      );
    }
  }
  return out;
}

function patchHead(html, { title, description, canonical, jsonLdScript }) {
  let out = html;
  if (title) {
    if (/<title>[^<]*<\/title>/i.test(out)) {
      out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(title)}</title>`);
    } else {
      out = out.replace('</head>', `<title>${escapeAttr(title)}</title>\n</head>`);
    }
  }

  if (description) {
    if (/<meta name="description"/i.test(out)) {
      out = out.replace(
        /<meta name="description" content="[^"]*"/i,
        `<meta name="description" content="${escapeAttr(description)}"`
      );
    } else {
      out = out.replace(
        '</head>',
        `<meta name="description" content="${escapeAttr(description)}" />\n</head>`
      );
    }
  }

  if (canonical) {
    if (/<link rel="canonical"/i.test(out)) {
      out = out.replace(/<link rel="canonical" href="[^"]*"/i, `<link rel="canonical" href="${escapeAttr(canonical)}"`);
    } else {
      out = out.replace('</head>', `<link rel="canonical" href="${escapeAttr(canonical)}" />\n</head>`);
    }
  }

  if (jsonLdScript && !out.includes(jsonLdScript)) {
    out = out.replace('</head>', `${jsonLdScript}\n${PRERENDER_CSS}\n</head>`);
  } else if (!out.includes('id="prerender-catalog-css"')) {
    out = out.replace('</head>', `${PRERENDER_CSS}\n</head>`);
  }

  return out;
}

function prepareBaseShell(html) {
  let out = html.replace(/<style id="prerender-catalog-css">[\s\S]*?<\/style>\n?/gi, '');
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/gi, '');
  if (out.includes('data-prerender="catalog"')) {
    out = clearStaticFallback(out);
    const rootStart = out.indexOf('<div id="root"');
    const bodyEnd = out.indexOf('</body>', rootStart);
    if (rootStart !== -1 && bodyEnd !== -1) {
      out = `${out.slice(0, rootStart)}<div id="root"></div>${out.slice(bodyEnd)}`;
    }
  }
  return out;
}

function isHomePrerendered(html) {
  return html.includes('data-prerender="catalog"') && html.includes('class="navbar"');
}

module.exports = {
  PRERENDER_CSS,
  escapeAttr,
  discoverSyncStylesheets,
  clearStaticFallback,
  injectStaticFallback,
  ensureSyncStylesheets,
  patchHead,
  prepareBaseShell,
  isHomePrerendered
};
