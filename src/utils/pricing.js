/**
 * Client-side checkout preview — must match `backend/utils/checkout.js` `computeTotalsPreview`.
 * @param {number} itemsPrice
 * @param {number} discountAmount
 * @param {string} deliveryOption
 * @param {object} settings
 * @param {number|null} [cartWeightKg]
 * @param {Array|null} [cartLines]
 */
import { normalizeWeightShippingSettings, resolveStandardShippingPrice, shouldUseFlatStandardShipping } from '../lib/shippingWeight';
import { findWeightShippingTier, formatWeightTierRange, hasWeightShippingTiers } from '../lib/weightShippingTiers';

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export {
  computeCartWeightKg,
  resolveProductWeightKg,
  normalizeWeightShippingSettings
} from '../lib/shippingWeight';

export function calculateShipping(itemsPrice, deliveryOption, settings = {}, cartWeightKg = null, cartLines = null) {
  const cfg = normalizeWeightShippingSettings(settings);
  const d = deliveryOption || 'standard';
  let shipping = 0;
  if (d === 'express') {
    shipping = round2(Number(cfg.shippingExpress) >= 0 ? Number(cfg.shippingExpress) : 499);
  } else if (d === 'nextday') {
    shipping = round2(Number(cfg.shippingNextDay) >= 0 ? Number(cfg.shippingNextDay) : 599);
  } else if (cfg.weightShippingEnabled) {
    shipping = resolveStandardShippingPrice(cartLines, cartWeightKg, settings);
  } else {
    shipping = round2(Number(cfg.shippingStandard) ?? 299);
  }

  const freeMin = Number(settings?.freeShippingMin);
  const skipFreeShipping =
    d === 'standard' &&
    cartLines &&
    (shouldUseFlatStandardShipping(cartLines, settings) ||
      (cfg.weightShippingEnabled && hasWeightShippingTiers(settings)));
  if (
    !skipFreeShipping &&
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
  cartWeightKg = null,
  cartLines = null
) {
  const disc = Math.min(Number(discountAmount) || 0, itemsPrice);
  const subAfterDisc = round2(Math.max(0, itemsPrice - disc));
  const shippingPrice = calculateShipping(itemsPrice, deliveryOption, settings, cartWeightKg, cartLines);
  const taxPrice = calculateTaxPrice(subAfterDisc, settings);
  const totalPrice = round2(Math.max(0, subAfterDisc + shippingPrice + taxPrice));

  let weightShippingTierLabel;
  if (
    (deliveryOption || 'standard') === 'standard' &&
    settings?.weightShippingEnabled !== false &&
    cartWeightKg != null &&
    cartLines &&
    !shouldUseFlatStandardShipping(cartLines, settings)
  ) {
    const tier = findWeightShippingTier(cartWeightKg, settings?.weightShippingTiers);
    if (tier) weightShippingTierLabel = formatWeightTierRange(tier);
  }

  return {
    itemsPrice,
    discountAmount: disc,
    subtotalAfterDiscount: subAfterDisc,
    shippingPrice,
    taxPrice,
    totalPrice,
    cartWeightKg: cartWeightKg != null ? cartWeightKg : undefined,
    weightShippingTierLabel
  };
}
