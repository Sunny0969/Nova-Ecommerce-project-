/**
 * Prerender overlay + JSON-LD seeds — avoids hydration flicker on catalog pages.
 * Prerender HTML lives in #static-fallback; React mounts into empty #root.
 */

let productSeed = null;

function parseJsonLdBlocks() {
  if (typeof document === 'undefined') return [];
  const blocks = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
    try {
      const data = JSON.parse(node.textContent || '');
      if (Array.isArray(data)) blocks.push(...data);
      else blocks.push(data);
    } catch {
      /* ignore malformed */
    }
  });
  return blocks;
}

function productFromSchema(block) {
  if (!block || block['@type'] !== 'Product') return null;
  const offers = block.offers && typeof block.offers === 'object' ? block.offers : {};
  const price = Number(offers.price);
  const images = Array.isArray(block.image) ? block.image : block.image ? [block.image] : [];
  const slugFromUrl = (() => {
    try {
      const u = new URL(String(block.url || offers.url || ''));
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || '';
    } catch {
      return '';
    }
  })();

  return {
    _id: block['@id'] || block.url || slugFromUrl,
    name: block.name || '',
    slug: slugFromUrl,
    price: Number.isFinite(price) ? price : 0,
    images: images.map((url) => ({ url: String(url) })),
    description: block.description || '',
    stock: String(offers.availability || '').includes('OutOfStock') ? 0 : 1,
    ratings: block.aggregateRating?.ratingValue
      ? Number(block.aggregateRating.ratingValue)
      : undefined,
    numReviews: block.aggregateRating?.reviewCount
      ? Number(block.aggregateRating.reviewCount)
      : undefined,
    _prerenderSeed: true
  };
}

/** Call once before React createRoot — reads JSON-LD while document head is intact. */
export function capturePrerenderDocumentSeeds() {
  if (typeof document === 'undefined') return;
  const fallback = document.getElementById('static-fallback');
  if (fallback?.dataset?.prerender !== 'catalog') return;

  for (const block of parseJsonLdBlocks()) {
    const p = productFromSchema(block);
    if (p?.name) {
      productSeed = p;
      break;
    }
  }
}

export function consumePrerenderProductSeed() {
  const seed = productSeed;
  productSeed = null;
  return seed;
}

export function peekPrerenderProductSeed() {
  return productSeed;
}

export function isPrerenderFallbackActive() {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById('static-fallback');
  return el?.dataset?.prerender === 'catalog' && !el.hasAttribute('hidden');
}

export function hidePrerenderFallback() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('static-fallback');
  if (!el) return;
  el.setAttribute('hidden', '');
  el.setAttribute('aria-hidden', 'true');
  document.body.classList.add('prerender-fallback-hidden');
}
