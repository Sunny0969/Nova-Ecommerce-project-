import {
  hasWeightShippingTiers,
  normalizeWeightShippingTiers,
  resolveTierShippingPrice
} from './weightShippingTiers';

/**
 * Client-side weight parsing — mirrors backend/lib/parseWeightKg.js
 * @param {string|number|null|undefined} input
 * @returns {number|null}
 */
export function parseWeightStringToKg(input) {
  if (input == null || input === '') return null;
  if (typeof input === 'number' && Number.isFinite(input) && input >= 0) return input;

  const raw = String(input).trim().toLowerCase();
  if (!raw) return null;

  const m = raw.match(/^([\d.,]+)\s*(kg|kgs|kilogram|kilograms|g|gram|grams|gm|lb|lbs|pound|pounds)?$/i);
  if (!m) {
    const numOnly = Number(raw.replace(/[^\d.]/g, ''));
    return Number.isFinite(numOnly) && numOnly >= 0 ? numOnly : null;
  }

  const value = Number(String(m[1]).replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;

  const unit = (m[2] || 'kg').toLowerCase();
  if (unit === 'g' || unit === 'gram' || unit === 'grams' || unit === 'gm') {
    return Math.round((value / 1000) * 10000) / 10000;
  }
  if (unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds') {
    return Math.round(value * 0.453592 * 10000) / 10000;
  }
  return value;
}

function defaultProductWeightKg(settings) {
  const d = Number(settings?.defaultProductWeightKg);
  return Number.isFinite(d) && d > 0 ? d : 1;
}

/** Fill weight-shipping defaults when API/store doc omits new fields (e.g. before backend deploy). */
export function normalizeWeightShippingSettings(settings = {}) {
  return {
    ...settings,
    weightShippingEnabled: settings.weightShippingEnabled !== false,
    weightShippingTiers: normalizeWeightShippingTiers(settings.weightShippingTiers),
    weightShippingThresholdKg:
      Number.isFinite(Number(settings.weightShippingThresholdKg)) &&
      Number(settings.weightShippingThresholdKg) > 0
        ? Number(settings.weightShippingThresholdKg)
        : 1,
    shippingUpToThresholdKg:
      Number.isFinite(Number(settings.shippingUpToThresholdKg)) &&
      Number(settings.shippingUpToThresholdKg) >= 0
        ? Number(settings.shippingUpToThresholdKg)
        : 300,
    shippingAdditionalPerKgOver:
      Number.isFinite(Number(settings.shippingAdditionalPerKgOver)) &&
      Number(settings.shippingAdditionalPerKgOver) >= 0
        ? Number(settings.shippingAdditionalPerKgOver)
        : 150,
    defaultProductWeightKg: defaultProductWeightKg(settings)
  };
}

export function resolveProductWeightKg(product, settings) {
  const cfg = normalizeWeightShippingSettings(settings);
  if (!product) return cfg.defaultProductWeightKg;

  const explicit = getExplicitProductWeightKg(product);
  if (explicit != null) return explicit;

  return cfg.defaultProductWeightKg;
}

export function getExplicitProductWeightKg(product) {
  if (!product) return null;

  const direct = Number(product.weightKg);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const parsed = parseWeightStringToKg(product.weight);
  if (parsed != null && parsed > 0) return parsed;

  return null;
}

export function productHasExplicitWeightKg(product) {
  return getExplicitProductWeightKg(product) != null;
}

export function cartHasAnyMissingProductWeight(cartLines) {
  for (const line of cartLines || []) {
    const qty = Math.max(0, Number(line.quantity) || 0);
    if (!qty) continue;
    const p = line.product && typeof line.product === 'object' ? line.product : null;
    if (!productHasExplicitWeightKg(p)) return true;
  }
  return false;
}

export function computeExplicitCartWeightKg(cartLines) {
  let total = 0;
  for (const line of cartLines || []) {
    const qty = Math.max(0, Number(line.quantity) || 0);
    if (!qty) continue;
    const p = line.product && typeof line.product === 'object' ? line.product : null;
    const w = getExplicitProductWeightKg(p);
    if (w != null) total += w * qty;
  }
  return Math.round(total * 1000) / 1000;
}

export function shouldUseFlatStandardShipping(cartLines, settings = {}) {
  if (!cartLines || !cartLines.length) return true;

  // Tier ranges: always price by total cart weight (incl. default weight per product).
  if (hasWeightShippingTiers(settings)) {
    return false;
  }

  if (cartHasAnyMissingProductWeight(cartLines)) return true;

  const cfg = normalizeWeightShippingSettings(settings);
  return computeExplicitCartWeightKg(cartLines) < cfg.weightShippingThresholdKg;
}

export function resolveStandardShippingPrice(cartLines, cartWeightKg, settings = {}) {
  const cfg = normalizeWeightShippingSettings(settings);

  if (settings.weightShippingEnabled === false) {
    return Math.round(Number(cfg.shippingStandard ?? 299) * 100) / 100;
  }

  if (shouldUseFlatStandardShipping(cartLines, settings)) {
    return Math.round(Number(cfg.shippingStandard ?? 299) * 100) / 100;
  }

  const w = cartWeightKg != null ? cartWeightKg : computeCartWeightKg(cartLines, settings);
  return calculateWeightBasedShipping(w, settings);
}

/** @param {Array<{ product?: object, quantity?: number }>} cartLines */
export function computeCartWeightKg(cartLines, settings) {
  let total = 0;
  for (const line of cartLines || []) {
    const qty = Math.max(0, Number(line.quantity) || 0);
    if (!qty) continue;
    const p = line.product && typeof line.product === 'object' ? line.product : null;
    total += resolveProductWeightKg(p, settings) * qty;
  }
  return Math.round(total * 1000) / 1000;
}

export function calculateWeightBasedShipping(totalWeightKg, settings) {
  const cfg = normalizeWeightShippingSettings(settings);
  const tiers = cfg.weightShippingTiers;
  if (tiers.length) {
    const tierPrice = resolveTierShippingPrice(totalWeightKg, tiers);
    if (tierPrice != null) return tierPrice;
    return Math.round(Number(cfg.shippingStandard ?? 299) * 100) / 100;
  }

  const t = cfg.weightShippingThresholdKg;
  const baseRate = cfg.shippingUpToThresholdKg;
  const addRate = cfg.shippingAdditionalPerKgOver;

  const w = Math.max(0, Number(totalWeightKg) || 0);
  if (w <= t) return Math.round(baseRate * 100) / 100;

  const extraKg = w - t;
  const extraUnits = Math.ceil(extraKg - 1e-9);
  return Math.round((baseRate + extraUnits * addRate) * 100) / 100;
}
