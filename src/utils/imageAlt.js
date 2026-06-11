import { siteName } from './seo';

function formatCategoryLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Keyword-rich alt for product photos (listings, cart, detail). */
export function buildProductImageAlt(product, options = {}) {
  const name = String(product?.name || product || '').trim();
  const category =
    options.category ||
    formatCategoryLabel(
      typeof product?.category === 'string'
        ? product.category
        : product?.category?.name || product?.category?.slug || product?.categorySlug || ''
    );

  if (!name) return `Product photo at ${siteName}`;
  if (category) return `${name} — buy ${category} online at ${siteName}`;
  return `${name} — shop online at ${siteName}`;
}

/** Alt for category tile images. */
export function buildCategoryImageAlt(name, slug) {
  const label = String(name || slug || 'category').trim();
  return `${label} — shop online at ${siteName}`;
}

/** Alt for brand logos. */
export function buildBrandImageAlt(name) {
  const label = String(name || 'brand').trim();
  return `${label} brand — shop at ${siteName}`;
}

/** Alt for blog featured images. */
export function buildBlogImageAlt(blog) {
  if (blog?.imageAlt) return String(blog.imageAlt).trim();
  const title = String(blog?.title || '').trim();
  if (title) return `${title} — ${siteName} blog`;
  return `${siteName} blog article`;
}
