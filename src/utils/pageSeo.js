import { siteName } from './seo';

const TITLE_MAX = 60;
const META_MIN = 140;
const META_MAX = 160;
const KEYWORDS_MAX = 12;
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
 * Meta description 140–160 chars with keyword + CTA.
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

/**
 * Comma-separated meta keywords (max 12 unique terms). Google largely ignores
 * keywords meta, but some tools still read it — keep concise and page-specific.
 */
export function buildMetaKeywords(...terms) {
  const unique = [];
  const seen = new Set();
  for (const term of terms.flat()) {
    const raw = String(term || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(raw);
    if (unique.length >= KEYWORDS_MAX) break;
  }
  return unique.join(', ');
}

export { getShopListingCanonicalPath } from './urls';
