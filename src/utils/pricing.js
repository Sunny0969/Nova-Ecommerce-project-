/**
 * Client-side checkout preview — must match `backend/utils/checkout.js` `computeTotalsPreview`.
 * @param {number} itemsPrice
 * @param {number} discountAmount
 * @param {string} deliveryOption
 * @param {{ freeShippingMin?: number, shippingStandard?: number, shippingExpress?: number, shippingNextDay?: number, taxRate?: number }} settings
 */
export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export function calculateShipping(itemsPrice, deliveryOption, settings = {}) {
  const threshold = Number(settings?.freeShippingMin);
  const t = Number.isFinite(threshold) && threshold >= 0 ? threshold : 50;
  const d = deliveryOption || 'standard';
  if (d === 'express') {
    if (itemsPrice >= t) return 0;
    return round2(Number(settings?.shippingExpress) ?? 5.99);
  }
  if (d === 'nextday') {
    if (itemsPrice >= t) return 0;
    return round2(Number(settings?.shippingNextDay) ?? 9.99);
  }
  // Standard — flat rate (default PKR 299); not waived by free-shipping threshold
  return round2(Number(settings?.shippingStandard) ?? 299);
}

export function calculateTaxPrice(subtotalAfterDiscount, settings = {}) {
  const rate = Math.min(1, Math.max(0, Number(settings?.taxRate) || 0));
  return round2(Math.max(0, subtotalAfterDiscount) * rate);
}

export function computeTotalsPreview(itemsPrice, discountAmount, deliveryOption, settings) {
  const disc = Math.min(Number(discountAmount) || 0, itemsPrice);
  const subAfterDisc = round2(Math.max(0, itemsPrice - disc));
  const shippingPrice = calculateShipping(itemsPrice, deliveryOption, settings);
  const taxPrice = calculateTaxPrice(subAfterDisc, settings);
  const totalPrice = round2(Math.max(0, subAfterDisc + shippingPrice + taxPrice));
  return {
    itemsPrice,
    discountAmount: disc,
    subtotalAfterDiscount: subAfterDisc,
    shippingPrice,
    taxPrice,
    totalPrice
  };
}
