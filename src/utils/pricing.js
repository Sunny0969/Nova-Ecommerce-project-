/**
 * Client-side checkout preview — must match `backend/utils/checkout.js` `computeTotalsPreview`.
 * @param {number} itemsPrice
 * @param {number} discountAmount
 * @param {string} deliveryOption
 * @param {object} settings
 * @param {number|null} [cartWeightKg]
 */
import { calculateWeightBasedShipping, normalizeWeightShippingSettings } from '../lib/shippingWeight';

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export {
  computeCartWeightKg,
  resolveProductWeightKg,
  normalizeWeightShippingSettings
} from '../lib/shippingWeight';

export function calculateShipping(itemsPrice, deliveryOption, settings = {}, cartWeightKg = null) {
  const cfg = normalizeWeightShippingSettings(settings);
  const d = deliveryOption || 'standard';
  let shipping = 0;
  if (d === 'express') {
    shipping = round2(Number(cfg.shippingExpress) >= 0 ? Number(cfg.shippingExpress) : 499);
  } else if (d === 'nextday') {
    shipping = round2(Number(cfg.shippingNextDay) >= 0 ? Number(cfg.shippingNextDay) : 599);
  } else if (cfg.weightShippingEnabled && cartWeightKg != null) {
    shipping = calculateWeightBasedShipping(cartWeightKg, cfg);
  } else {
    shipping = round2(Number(cfg.shippingStandard) ?? 299);
  }

  const freeMin = Number(settings?.freeShippingMin);
  if (
    d === 'standard' &&
    Number.isFinite(freeMin) &&
    freeMin > 0 &&
    Number(itemsPrice) >= freeMin
  ) {
    return 0;
  }
  return shipping;
}

export function calculateTaxPrice(subtotalAfterDiscount, settings = {}) {
  const rate = Math.min(1, Math.max(0, Number(settings?.taxRate) || 0));
  return round2(Math.max(0, subtotalAfterDiscount) * rate);
}

export function computeTotalsPreview(
  itemsPrice,
  discountAmount,
  deliveryOption,
  settings,
  cartWeightKg = null
) {
  const disc = Math.min(Number(discountAmount) || 0, itemsPrice);
  const subAfterDisc = round2(Math.max(0, itemsPrice - disc));
  const shippingPrice = calculateShipping(itemsPrice, deliveryOption, settings, cartWeightKg);
  const taxPrice = calculateTaxPrice(subAfterDisc, settings);
  const totalPrice = round2(Math.max(0, subAfterDisc + shippingPrice + taxPrice));
  return {
    itemsPrice,
    discountAmount: disc,
    subtotalAfterDiscount: subAfterDisc,
    shippingPrice,
    taxPrice,
    totalPrice,
    cartWeightKg: cartWeightKg != null ? cartWeightKg : undefined
  };
}
