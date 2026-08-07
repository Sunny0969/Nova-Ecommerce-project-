const fs = require('fs');
const path = require('path');
const {
  applyPrerenderPage,
  normalizeRoutePath,
  prerenderFileForRoute,
  wantsHtmlDocument,
  isCrawlerRequest,
  isBrowserDocumentNavigation
} = require('./lib/prerenderHtml');

const ROOT = path.join(__dirname, '..');
const PUBLIC_INDEX = path.join(ROOT, 'public', 'index.html');
const BUILD_DIR = path.join(ROOT, 'build');
const CACHE_FILE = path.join(__dirname, '.crawl-cache.json');

function loadCrawlCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.routes && typeof parsed.routes === 'object' ? parsed.routes : null;
  } catch {
    return null;
  }
}

function sendHtml(res, html, method) {
  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (method === 'HEAD') {
    res.end();
    return;
  }
  res.send(html);
}

/**
 * Dev server: serve prerendered HTML without JavaScript (build output or crawl cache).
 * Normal browser navigations always pass through to webpack so JS/CSS bundles load.
 */
function createCrawlHtmlMiddleware() {
  const crawlRoutes = loadCrawlCache();
  let publicShell = null;
  const isDev = process.env.NODE_ENV !== 'production';

  return function crawlHtmlMiddleware(req, res, next) {
    // Dev: never serve static prerender — browsers need webpack bundles.
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    if (!wantsHtmlDocument(req)) return next();

    const route = normalizeRoutePath(req.path);

    // Only use production build HTML when not in dev (preview uses `serve`, not this).
    if (!isDev) {
      const buildHtml = prerenderFileForRoute(BUILD_DIR, route);
      if (buildHtml) {
        return sendHtml(res, buildHtml, req.method);
      }
    }

    if (crawlRoutes?.[route]) {
      if (!publicShell) {
        try {
          publicShell = fs.readFileSync(PUBLIC_INDEX, 'utf8');
        } catch {
          return next();
        }
      }
      const html = applyPrerenderPage(publicShell, crawlRoutes[route]);
      return sendHtml(res, html, req.method);
    }

    return next();
  };
}

module.exports = { createCrawlHtmlMiddleware };
