# Catalog Pre-rendering (CRA / Hostinger)

This project pre-renders **Home**, **Shop**, and **category listing** pages at **build time** so Googlebot receives semantic HTML (headings, category links, product names, prices, descriptions) on the **first HTTP response** — without executing React or waiting for client-side API calls.

No Next.js migration required.

---

## How it works

```
npm run build          → CRA bundle (JS/CSS)
npm run prerender      → Fetches live catalog API → writes static HTML shells
Deploy build/          → Apache serves route-specific index.html when present
Browser loads          → hydrateRoot() attaches React to existing #root markup
```

| Route | Output file | Content |
|-------|-------------|---------|
| `/` | `build/index.html` | Categories + featured products |
| `/shop` | `build/shop/index.html` | Full shop grid |
| `/groceries` (example) | `build/groceries/index.html` | Category products |

Apache (`.htaccess`) serves `/{slug}/index.html` when it exists, otherwise falls back to SPA `index.html`.

---

## Commands

```bash
cd frontend

# Standard production build
npm run build

# Inject catalog HTML (requires network → Railway API)
npm run prerender

# Validate prerender output
npm run prerender:verify

# Full Hostinger pipeline (build + prerender + all verifiers)
npm run build:hostinger
```

Recommended deploy order:

1. `node ../backend/scripts/generateSitemap.js` (optional, when catalog changed)
2. `npm run build:hostinger`
3. Upload entire `frontend/build/` to Hostinger `public_html`

---

## Configuration

Edit `frontend/scripts/prerender.config.js` or use environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PRERENDER_API_URL` | Railway production URL | Catalog API for build-time fetch |
| `PRERENDER_SITE_URL` | `https://www.bazaar-pk.com` | Canonical URLs in meta + JSON-LD |
| `PRERENDER_MAX_CATEGORIES` | `80` | Max category pages to pre-render |
| `PRERENDER_PRODUCTS_PER_PAGE` | `20` | Products per listing page |
| `PRERENDER_HOME_PRODUCTS` | `12` | Featured products on home |

---

## Why not react-snap?

`react-snap` targets React 16/17 and `ReactDOM.hydrate()` with a headless browser snapshot. This CRA app uses **React 18 `createRoot`**, lazy routes, and auth contexts — react-snap often produces hydration mismatches or empty snapshots.

Our approach:

1. **API-driven HTML** at build time (same data Google should index)
2. **Explicit semantic markup** (`<h1>`, `<article>`, Schema.org microdata, ItemList JSON-LD)
3. **`hydrateRoot`** only when `#root[data-prerender="catalog"]` has children

---

## Optional: Puppeteer full-page snapshot

For pixel-perfect DOM (including lazy sections), add a post-build Playwright/Puppeteer script that:

1. Serves `build/` with `npx serve -s build`
2. Visits `/`, `/shop`, and category URLs
3. Waits for `[data-testid="product-grid"]` or network idle
4. Saves `page.content()` to route `index.html` files

Use when API templates are not enough. Trade-off: slower CI, heavier dependency, more hydration mismatch risk.

---

## Express middleware alternative (SSR-lite)

If you later move off static Hostinger to Node:

```javascript
// Express — inject prerender shell for bots only
app.get(['/', '/shop', '/:categorySlug'], async (req, res, next) => {
  const ua = req.get('user-agent') || '';
  const isBot = /googlebot|bingbot|slurp/i.test(ua);
  if (!isBot) return next();
  const html = await renderCatalogShell(req.path); // reuse prerenderTemplates.js
  res.send(html);
});
```

Reuse `scripts/lib/prerenderTemplates.js` and `prerenderApi.js` from the Express handler.

---

## Verify in Google Search Console

1. **URL Inspection** → Test live URL → **View crawled page** → HTML should show product `<h2>` names inside `#root`.
2. **Rich Results Test** — ItemList JSON-LD on home/shop/category pages.
3. Compare **Page resource load** before/after — HTML payload increases, but JS execution is no longer required to *discover* product text.

Target: home `index.html` text ratio **>70%** after stripping scripts/styles (run `npm run prerender:verify` for a local estimate).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `GET /api/products → 5xx` | Set `PRERENDER_API_URL` to a reachable API; run prerender from CI with network |
| Category page 404 on Hostinger | Ensure `build/{slug}/index.html` was uploaded; check `.htaccess` prerender rules |
| Hydration warning in console | Expected on first paint if prerender markup differs slightly from React; SEO content is still in first response |
| Empty product grid | API returned no published products; check catalog on Railway |

---

## Files

| File | Role |
|------|------|
| `scripts/prerender-catalog.js` | Main build step |
| `scripts/prerender.config.js` | Limits + URLs |
| `scripts/lib/prerenderApi.js` | Fetches `/api/categories`, `/api/products` |
| `scripts/lib/prerenderTemplates.js` | Semantic HTML + JSON-LD |
| `scripts/verify-prerender.js` | CI guard |
| `src/index.js` | `hydrateRoot` when prerendered |
| `public/.htaccess` | Serves per-route `index.html` |
