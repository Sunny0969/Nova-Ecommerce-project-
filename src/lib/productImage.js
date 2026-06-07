import { optimizeImageUrl } from '../utils/optimizedImageUrl';

/** First image URL from API-shaped product (list/detail). */
export function productImageUrl(product, options) {
  if (!product) return '';
  let url = '';
  if (product.imageUrl) url = String(product.imageUrl).trim();
  else {
    const first = product.images?.[0];
    if (typeof first === 'string') url = first.trim();
    else {
      const u = first?.url;
      url = u ? String(u).trim() : '';
    }
  }
  return url ? optimizeImageUrl(url, options) : '';
}
