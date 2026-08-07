function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** @param {Array<{ minKg?: number, maxKg?: number, price?: number }>|null|undefined} raw */
export function normalizeWeightShippingTiers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => ({
      minKg: round2(Math.max(0, Number(t?.minKg) || 0)),
      maxKg: round2(Number(t?.maxKg)),
      price: round2(Math.max(0, Number(t?.price) || 0))
    }))
    .filter((t) => Number.isFinite(t.maxKg) && t.maxKg >= t.minKg && Number.isFinite(t.price))
    .sort((a, b) => a.minKg - b.minKg);
}

/** @param {number} weightKg @param {Array<{ minKg: number, maxKg: number, price: number }>} tiers */
export function findWeightShippingTier(weightKg, tiers) {
  const w = round2(Math.max(0, Number(weightKg) || 0));
  const list = normalizeWeightShippingTiers(tiers);
  if (!list.length) return null;

  for (const tier of list) {
    if (w >= tier.minKg && w <= tier.maxKg) return tier;
  }

  const last = list[list.length - 1];
  if (w > last.maxKg) return last;

  return null;
}

/** @returns {number|null} */
export function resolveTierShippingPrice(weightKg, tiers) {
  const tier = findWeightShippingTier(weightKg, tiers);
  if (!tier) return null;
  return round2(tier.price);
}

export function formatWeightTierRange(tier) {
  if (!tier) return '';
  return `${tier.minKg}–${tier.maxKg} kg`;
}

export function hasWeightShippingTiers(settings) {
  return normalizeWeightShippingTiers(settings?.weightShippingTiers).length > 0;
}
