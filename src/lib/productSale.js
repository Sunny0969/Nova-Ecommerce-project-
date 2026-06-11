/**
 * Sale price = current `price`. Actual/original = `originalPrice` or `comparePrice`.
 */
export function getProductSalePrices(product) {
  if (!product) return null;

  const price = Number(product.price);
  const compareAt = Number(product.originalPrice ?? product.comparePrice);

  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(compareAt) || compareAt <= 0) return null;
  if (compareAt <= price) return null;

  const discountPercent = Math.round(((compareAt - price) / compareAt) * 100);

  return {
    salePrice: price,
    originalPrice: compareAt,
    discountPercent
  };
}

export function isProductOnSale(product) {
  return getProductSalePrices(product) != null;
}

export function filterOnSaleProducts(products) {
  if (!Array.isArray(products)) return [];
  return products.filter(isProductOnSale);
}

/** Highest sale % across a product list (same rules as flash sale cards). */
export function getMaxProductDiscountPercent(products) {
  if (!Array.isArray(products)) return 0;
  return products.reduce((max, product) => {
    const sale = getProductSalePrices(product);
    return sale ? Math.max(max, sale.discountPercent) : max;
  }, 0);
}
