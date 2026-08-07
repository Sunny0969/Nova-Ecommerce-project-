/**
 * Validates BreadcrumbList JSON-LD uses absolute https URLs on every item.
 * Run: node scripts/verify-breadcrumb-schema.js
 */
const assert = require('assert');

const productionSiteUrl = 'https://www.bazaar-pk.com';

function normalizeSiteOrigin(origin) {
  const base = String(origin || '').trim().replace(/\/+$/, '');
  if (!base) return productionSiteUrl;
  try {
    const u = new URL(base);
    if (u.hostname === 'bazaar-pk.com') u.hostname = 'www.bazaar-pk.com';
    return u.origin;
  } catch {
    return productionSiteUrl;
  }
}

function getSiteUrl() {
  return productionSiteUrl;
}

function collapsePathSlashes(pathname) {
  const p = String(pathname || '/');
  if (p === '/') return '/';
  return `/${p.replace(/^\/+/, '').replace(/\/{2,}/g, '/')}`;
}

function resolveAbsoluteUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === 'undefined' || raw === 'null') {
    return `${getSiteUrl()}/`;
  }
  if (/^https?:\/\//i.test(raw)) {
    const u = new URL(raw);
    if (u.hostname === 'bazaar-pk.com') u.hostname = 'www.bazaar-pk.com';
    u.pathname = collapsePathSlashes(u.pathname);
    return u.href;
  }
  const base = getSiteUrl();
  let pathPart = raw;
  let search = '';
  const queryIdx = pathPart.indexOf('?');
  if (queryIdx >= 0) {
    search = pathPart.slice(queryIdx);
    pathPart = pathPart.slice(0, queryIdx) || '/';
  }
  const path = collapsePathSlashes(pathPart.startsWith('/') ? pathPart : `/${pathPart}`);
  const u = new URL(`${base}${path}${search}`);
  if (u.hostname === 'bazaar-pk.com') u.hostname = 'www.bazaar-pk.com';
  return u.href;
}

function buildBreadcrumbListSchema(items) {
  const itemListElement = items.map((it, i) => {
    const name = String(it.name || 'Page').trim();
    const itemUrl =
      it.url != null && String(it.url).trim() !== ''
        ? resolveAbsoluteUrl(it.url)
        : resolveAbsoluteUrl(it.path || '/');
    return {
      '@type': 'ListItem',
      '@id': `${itemUrl}#breadcrumb`,
      position: i + 1,
      name,
      item: itemUrl
    };
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement };
}

function assertAbsolute(label, url) {
  assert(/^https:\/\/www\.bazaar-pk\.com/i.test(url), `${label}: not absolute www URL → ${url}`);
  assert(!url.includes('undefined'), `${label}: contains undefined → ${url}`);
  assert(!url.includes('//shop'), `${label}: double slash in path → ${url}`);
}

const productCrumbs = buildBreadcrumbListSchema([
  { name: 'Home', path: '/' },
  { name: 'Tea & Coffee', path: '/tea-coffee' },
  { name: 'Lipton Tea', path: '/tea-coffee/lipton-yellow-label-tea-pack-tea-bags-x-25' }
]);

productCrumbs.itemListElement.forEach((el, i) => {
  assertAbsolute(`product crumb ${i} item`, el.item);
  assertAbsolute(`product crumb ${i} @id`, el['@id'].replace(/#breadcrumb$/, ''));
});

const relativeInput = buildBreadcrumbListSchema([
  { name: 'Home', url: '/shop' },
  { name: 'Shop', url: '//shop' }
]);
relativeInput.itemListElement.forEach((el, i) => {
  assertAbsolute(`relative input ${i}`, el.item);
});

const apex = buildBreadcrumbListSchema([
  { name: 'Home', url: 'https://bazaar-pk.com/' },
  { name: 'Blog', url: 'https://bazaar-pk.com/blog' }
]);
apex.itemListElement.forEach((el) => {
  assert(/^https:\/\/www\.bazaar-pk\.com\//.test(el.item), `apex not upgraded: ${el.item}`);
});

console.log('[verify-breadcrumb-schema] OK — all breadcrumb item/@id URLs are absolute https://www.bazaar-pk.com/...');
