/** First image URL from API-shaped product (list/detail). */
export function productImageUrl(product) {
  if (!product) return '';
  if (product.imageUrl) return String(product.imageUrl).trim();
  const first = product.images?.[0];
  if (typeof first === 'string') return first.trim();
  const u = first?.url;
  return u ? String(u).trim() : '';
}
