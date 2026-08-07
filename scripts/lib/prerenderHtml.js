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
.prerender-product-detail__desc{margin:1rem 0;line-height:1.65;color:#3d3d4e;white-space:pre-wrap}
.prerender-blog-list,.prerender-brand-list{margin:0;padding:0;list-style:none;display:grid;gap:.75rem}
.prerender-blog-card,.prerender-brand-card{background:#fff;border:1px solid #e8e2d8;border-radius:.75rem;padding:.85rem}
.prerender-blog-card a,.prerender-brand-card a{color:#1a1a2e;text-decoration:none;font-weight:600}
.prerender-static-body{margin:0;line-height:1.65;color:#3d3d4e}
.prerender-static-body p{margin:0 0 .75rem}
</style>`;

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function patchHead(html, { title, description, canonical, jsonLdScript }) {
  let out = html;
  if (/<title>[^<]*<\/title>/i.test(out)) {
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  } else {
    out = out.replace('</head>', `<title>${escapeAttr(title)}</title>\n</head>`);
  }

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

  if (/<link rel="canonical"/i.test(out)) {
    out = out.replace(/<link rel="canonical" href="[^"]*"/i, `<link rel="canonical" href="${escapeAttr(canonical)}"`);
  } else {
    out = out.replace('</head>', `<link rel="canonical" href="${escapeAttr(canonical)}" />\n</head>`);
  }

  const ogPairs = [
    ['og:title', title],
    ['og:description', description],
    ['og:url', canonical],
    ['twitter:title', title],
    ['twitter:description', description]
  ];

  for (const [prop, value] of ogPairs) {
    const isTwitter = prop.startsWith('twitter:');
    const attr = isTwitter ? 'name' : 'property';
    const re = new RegExp(`<meta ${attr}="${prop}" content="[^"]*"`, 'i');
    const tag = `<meta ${attr}="${prop}" content="${escapeAttr(value)}"`;
    if (re.test(out)) out = out.replace(re, tag);
    else out = out.replace('</head>', `${tag} />\n</head>`);
  }

  out = out.replace(/<style id="prerender-catalog-css">[\s\S]*?<\/style>\n?/gi, '');
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/gi, '');

  if (jsonLdScript && !out.includes(jsonLdScript)) {
    out = out.replace('</head>', `${jsonLdScript}\n${PRERENDER_CSS}\n</head>`);
  } else if (!out.includes('id="prerender-catalog-css"')) {
    out = out.replace('</head>', `${PRERENDER_CSS}\n</head>`);
  }

  return out;
}

function injectRoot(html, rootHtml, { strict = false } = {}) {
  const root = `<div id="root" data-prerender="catalog">${rootHtml}</div>`;
  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', root);
  }
  const replaced = html.replace(/<div id="root"[^>]*>[\s\S]*?<\/div>\s*(?=<\/body>)/i, root);
  if (replaced === html && strict) {
    throw new Error('HTML shell is missing a replaceable <div id="root">.');
  }
  return replaced;
}

function applyPrerenderPage(html, page) {
  return patchHead(injectRoot(html, page.rootHtml), page);
}

function normalizeRoutePath(urlPath = '') {
  const clean = String(urlPath).split('?')[0].split('#')[0];
  if (!clean || clean === '/') return '/';
  return clean.replace(/\/$/, '') || '/';
}

function prerenderFileForRoute(buildDir, routePath) {
  const route = normalizeRoutePath(routePath);
  const file =
    route === '/'
      ? require('path').join(buildDir, 'index.html')
      : require('path').join(buildDir, route.replace(/^\//, ''), 'index.html');
  const fs = require('fs');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('data-prerender="catalog"')) return null;
  return html;
}

function wantsHtmlDocument(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  const accept = String(req.headers.accept || '');
  if (!accept.includes('text/html') && !accept.includes('*/*')) return false;
  const p = req.path || req.url || '';
  if (p.startsWith('/sockjs-node') || p.startsWith('/ws')) return false;
  if (/\.[a-z0-9]+$/i.test(p.split('?')[0])) return false;
  return true;
}

/** Bots / SEO tools — not normal Chrome/Firefox/Safari navigations. */
function isCrawlerRequest(req) {
  const q = req.query || {};
  if (String(q.__static || q.prerender || '') === '1') return true;

  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (!ua) return true;

  return /bot|crawler|spider|crawl|slurp|mediapartners|facebookexternalhit|whatsapp|telegram|linkedinbot|twitterbot|bingpreview|googlebot|yandex|baidu|duckduck|semrush|ahrefs|mj12|petalbot|bytespider|gptbot|claudebot|anthropic|perplexity|curl|wget|python-requests|go-http-client|scrapy|headless/i.test(
    ua
  );
}

function isBrowserDocumentNavigation(req) {
  const dest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
  const mode = String(req.headers['sec-fetch-mode'] || '').toLowerCase();
  if (dest === 'document' || mode === 'navigate') return true;

  const ua = String(req.headers['user-agent'] || '');
  return /mozilla\/5\.0/i.test(ua) && /(chrome|firefox|safari|edg|opera)/i.test(ua);
}

module.exports = {
  PRERENDER_CSS,
  escapeAttr,
  patchHead,
  injectRoot,
  applyPrerenderPage,
  normalizeRoutePath,
  prerenderFileForRoute,
  wantsHtmlDocument,
  isCrawlerRequest,
  isBrowserDocumentNavigation
};
