import { siteName } from './seo';

const TITLE_MAX = 60;
const META_MIN = 140;
const META_MAX = 155;
const BRAND_SUFFIX = ` | ${siteName}`;

/**
 * Primary Keyword — Secondary | Brand (≤60 chars, primary front-loaded).
 */
export function buildPageTitle(primary, secondary) {
  const p = String(primary || '').trim();
  const s = String(secondary || '').trim();
  if (!p) return siteName;

  let base = s ? `${p} — ${s}` : p;
  const withBrand = `${base}${BRAND_SUFFIX}`;
  if (withBrand.length <= TITLE_MAX) return withBrand;

  const budget = TITLE_MAX - BRAND_SUFFIX.length;
  if (s && `${p} — ${s}`.length > budget) {
    base = p.length <= budget ? p : `${p.slice(0, budget - 1).trim()}…`;
  } else {
    base = base.length <= budget ? base : `${base.slice(0, budget - 1).trim()}…`;
  }
  return `${base}${BRAND_SUFFIX}`;
}

/**
 * Meta description 140–155 chars with keyword + CTA.
 */
export function buildMetaDescription(primaryKeyword, actionPhrase, extraContext = '') {
  const kw = String(primaryKeyword || '').trim();
  const action = String(actionPhrase || 'Shop now with fast delivery across Pakistan.').trim();
  const ctx = String(extraContext || '').trim();
  let text = ctx ? `${ctx} ${action}` : action;
  if (kw && !text.toLowerCase().includes(kw.toLowerCase())) {
    text = `${kw}: ${text}`;
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > META_MAX) {
    return `${text.slice(0, META_MAX - 1).trim()}…`;
  }
  if (text.length < META_MIN && kw) {
    const pad = ` Order ${kw.toLowerCase()} online at ${siteName} with secure checkout.`;
    text = `${text}${pad}`.replace(/\s+/g, ' ').trim();
    if (text.length > META_MAX) return `${text.slice(0, META_MAX - 1).trim()}…`;
  }
  return text;
}

export function truncateTitle(title, max = TITLE_MAX) {
  const t = String(title || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function truncateMetaDescription(text, max = META_MAX) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return t;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/** Shop listing canonical: strip pagination/filters except single category or brand. */
export function getShopListingCanonicalPath(searchParams) {
  const brand = (searchParams.get('brand') || '').trim();
  if (brand) {
    return `/shop?brand=${encodeURIComponent(brand)}`;
  }
  const cats = searchParams.getAll('category').filter(Boolean);
  const singleCat = cats.length === 1 ? cats[0] : searchParams.get('cat');
  if (singleCat && singleCat !== 'all') {
    return `/shop?category=${encodeURIComponent(singleCat)}`;
  }
  return '/shop';
}
