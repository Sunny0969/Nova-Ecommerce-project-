/**
 * Product global identifiers for schema.org / Google Merchant (GTIN, brand, SKU, MPN).
 */

/** Longest-first so "American Garden" matches before "American". */
export const KNOWN_BRAND_PREFIXES = [
  'American Garden',
  'Arizona Fields',
  "Mitchell's",
  'National',
  'Palmolive',
  'Figaro',
  'Polac',
  'Nofea',
  'Hilal',
  'Knorr',
  'Nestle',
  "Nestlé",
  'Maggi',
  'Shan',
  'Tapal',
  'Lipton',
  'Colgate',
  'Dove',
  'Lifebuoy',
  'Surf',
  'Sunlight',
  'Vim',
  'Harpic',
  'Dettol',
  'Sensodyne',
  'Head & Shoulders',
  'Pantene',
  'Garnier',
  'Nivea',
  'Vaseline',
  'Olper',
  'Milkpak',
  'Rafhan',
  'Mitchells'
].sort((a, b) => b.length - a.length);

const STORE_BRAND_RE = /^bazaar(\s|$|-)/i;

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * @param {string} value
 * @returns {Record<string, string>|null}
 */
export function formatGtinForSchema(value) {
  const digits = digitsOnly(value);
  if (!digits) return null;

  let normalized = digits;
  if (normalized.length === 11) normalized = `0${normalized}`;
  if (normalized.length > 14) normalized = normalized.slice(0, 14);
  if (normalized.length > 8 && normalized.length < 12) normalized = normalized.padStart(12, '0');
  if (normalized.length > 12 && normalized.length < 13) normalized = normalized.padStart(13, '0');

  if (normalized.length === 8) {
    return { gtin8: normalized, gtin: normalized };
  }
  if (normalized.length === 12) {
    return { gtin12: normalized, gtin: normalized };
  }
  if (normalized.length === 13) {
    return { gtin13: normalized, gtin: normalized };
  }
  if (normalized.length === 14) {
    return { gtin14: normalized, gtin: normalized };
  }

  return { gtin: normalized, gtin13: normalized.padStart(13, '0').slice(-13) };
}

/**
 * @param {string} productName
 * @returns {string|null}
 */
export function inferBrandFromProductName(productName) {
  const name = String(productName || '').trim();
  if (!name) return null;

  const lower = name.toLowerCase();
  for (const brand of KNOWN_BRAND_PREFIXES) {
    const bl = brand.toLowerCase();
    if (lower === bl || lower.startsWith(`${bl} `) || lower.startsWith(`${bl}-`)) {
      return brand;
    }
  }

  const match = name.match(/^([A-Z][A-Za-z0-9&'.]+(?:\s+[A-Z][A-Za-z0-9&'.]+){0,2})/);
  if (match && match[1].length >= 3 && !STORE_BRAND_RE.test(match[1])) {
    return match[1].trim();
  }

  return null;
}

function isGenericStoreBrand(name) {
  const n = String(name || '').trim();
  if (!n) return true;
  return /^bazaar$/i.test(n) || STORE_BRAND_RE.test(n);
}

/**
 * @param {object} product
 * @param {{ siteName?: string }} [opts]
 */
export function resolveProductBrandName(product, opts = {}) {
  const siteName = opts.siteName || 'Bazaar';
  const candidates = [
    product?.brandName,
    product?.brand?.name,
    typeof product?.brand === 'string' ? product.brand : null
  ];

  for (const raw of candidates) {
    if (raw != null && String(raw).trim() && !isGenericStoreBrand(raw)) {
      return String(raw).trim();
    }
  }

  const inferred = inferBrandFromProductName(product?.name);
  if (inferred) return inferred;

  for (const raw of candidates) {
    if (raw != null && String(raw).trim()) return String(raw).trim();
  }

  return siteName;
}

/**
 * @param {object} product
 */
export function resolveProductSku(product) {
  const sku = product?.sku;
  if (sku != null && String(sku).trim()) return String(sku).trim();
  const slug = product?.slug || product?.productId;
  if (slug) return String(slug).toUpperCase().replace(/-/g, '_');
  return undefined;
}

function resolveGtinRaw(product) {
  return product?.gtin || product?.ean || product?.upc || '';
}

/**
 * @param {object} product
 * @param {{ siteName?: string }} [opts]
 */
export function resolveProductManufacturerName(product, opts = {}) {
  const brand = resolveProductBrandName(product, opts);
  if (product?.manufacturer != null && String(product.manufacturer).trim()) {
    return String(product.manufacturer).trim();
  }
  if (brand && !isGenericStoreBrand(brand)) return brand;
  return undefined;
}

/**
 * @param {object} product
 * @param {{ siteName?: string }} [opts]
 */
export function buildProductGlobalIdentifierFields(product, opts = {}) {
  const brandName = resolveProductBrandName(product, opts);
  const sku = resolveProductSku(product);
  const gtinFields = formatGtinForSchema(resolveGtinRaw(product)) || {};
  const mpn =
    product?.mpn != null && String(product.mpn).trim() ? String(product.mpn).trim() : undefined;
  const manufacturerName = resolveProductManufacturerName(product, opts);

  const fields = {
    brand: {
      '@type': 'Brand',
      name: brandName
    }
  };

  if (sku) fields.sku = sku;
  Object.assign(fields, gtinFields);
  if (mpn) fields.mpn = mpn;
  if (manufacturerName) {
    fields.manufacturer = {
      '@type': 'Organization',
      name: manufacturerName
    };
  }

  return fields;
}
