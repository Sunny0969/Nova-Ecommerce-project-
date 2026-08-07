/** Per-option stock on variant axes — mirrors backend/lib/variantStock.js */

const AXIS_PRIORITY = ['size', 'shape', 'color'];

export function parseOptionStock(option) {
  if (!option || option.stock == null || option.stock === '') return null;
  const n = Number(option.stock);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export function axisHasOptionStock(axis) {
  if (!axis?.enabled || !Array.isArray(axis.options)) return false;
  return axis.options.some((o) => parseOptionStock(o) != null);
}

export function hasPerOptionStock(variantAxes) {
  if (!variantAxes || typeof variantAxes !== 'object') return false;
  return ['color', 'shape', 'size'].some((key) => axisHasOptionStock(variantAxes[key]));
}

export function resolveStockForPick(variantAxes, pick) {
  if (!variantAxes || !pick || typeof pick !== 'object') return null;

  const stocks = [];
  for (const key of AXIS_PRIORITY) {
    const ax = variantAxes[key];
    if (!ax?.enabled || !ax.options?.length) continue;
    if (!axisHasOptionStock(ax)) continue;

    const opts = ax.options.filter((o) => String(o?.label || '').trim());
    if (!opts.length) continue;

    const sel = pick[key];
    const idx = Array.isArray(sel) && sel.length ? Number(sel[0]) : 0;
    const safeIdx = Number.isFinite(idx) && idx >= 0 && idx < opts.length ? idx : 0;
    const opt = opts[safeIdx];
    const s = parseOptionStock(opt);
    stocks.push(s != null ? s : 0);
  }

  if (!stocks.length) return null;
  return Math.min(...stocks);
}

export function resolveEffectiveStock(product, variantPick) {
  if (!product) return 0;
  const base =
    product.stockQuantity != null && product.stockQuantity !== ''
      ? Number(product.stockQuantity)
      : Number(product.stock);
  const baseStock = Number.isFinite(base) ? Math.max(0, Math.floor(base)) : 0;

  if (!hasPerOptionStock(product.variantAxes)) return baseStock;

  const variantStock = resolveStockForPick(product.variantAxes, variantPick);
  return variantStock != null ? variantStock : baseStock;
}

export function isVariantOptionAvailable(variantAxes, pick, axisKey, optionIndex, productStock) {
  const testPick = { ...pick, [axisKey]: [optionIndex] };
  const resolved = resolveStockForPick(variantAxes, testPick);
  const stock = resolved != null ? resolved : productStock;
  return stock > 0;
}

export function buildDefaultVariantPick(variantAxes, trimOptions) {
  const next = {};
  for (const key of ['color', 'shape', 'size']) {
    const ax = variantAxes?.[key];
    if (!ax?.enabled || !ax.options?.length) continue;
    const opts = trimOptions(ax.options);
    if (!opts.length) continue;
    if (axisHasOptionStock(ax)) {
      const idx = opts.findIndex((o) => (parseOptionStock(o) ?? 0) > 0);
      next[key] = [idx >= 0 ? idx : 0];
    } else {
      next[key] = [0];
    }
  }
  return next;
}

export function parseOptionPrice(option) {
  if (!option || option.price == null || option.price === '') return null;
  const n = Number(option.price);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function parseOptionComparePrice(option) {
  if (!option || option.comparePrice == null || option.comparePrice === '') return null;
  const n = Number(option.comparePrice);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function axisHasOptionPrice(axis) {
  if (!axis?.enabled || !Array.isArray(axis.options)) return false;
  return axis.options.some((o) => parseOptionPrice(o) != null);
}

export function hasPerOptionPrice(variantAxes) {
  if (!variantAxes || typeof variantAxes !== 'object') return false;
  return ['color', 'shape', 'size'].some((key) => axisHasOptionPrice(variantAxes[key]));
}

export function resolvePriceForPick(variantAxes, pick) {
  if (!variantAxes || !pick || typeof pick !== 'object') return null;

  for (const key of AXIS_PRIORITY) {
    const ax = variantAxes[key];
    if (!ax?.enabled || !ax.options?.length) continue;
    if (!axisHasOptionPrice(ax)) continue;

    const opts = ax.options.filter((o) => String(o?.label || '').trim());
    if (!opts.length) continue;

    const sel = pick[key];
    const idx = Array.isArray(sel) && sel.length ? Number(sel[0]) : 0;
    const safeIdx = Number.isFinite(idx) && idx >= 0 && idx < opts.length ? idx : 0;
    const p = parseOptionPrice(opts[safeIdx]);
    if (p != null) return p;
  }

  return null;
}

export function resolveComparePriceForPick(variantAxes, pick) {
  if (!variantAxes || !pick || typeof pick !== 'object') return null;

  for (const key of AXIS_PRIORITY) {
    const ax = variantAxes[key];
    if (!ax?.enabled || !ax.options?.length) continue;
    if (!axisHasOptionPrice(ax)) continue;

    const opts = ax.options.filter((o) => String(o?.label || '').trim());
    if (!opts.length) continue;

    const sel = pick[key];
    const idx = Array.isArray(sel) && sel.length ? Number(sel[0]) : 0;
    const safeIdx = Number.isFinite(idx) && idx >= 0 && idx < opts.length ? idx : 0;
    const cp = parseOptionComparePrice(opts[safeIdx]);
    if (cp != null) return cp;
  }

  return null;
}

export function resolveEffectivePrice(product, variantPick) {
  if (!product) return 0;
  const base = Number(product.price);
  const basePrice = Number.isFinite(base) ? Math.max(0, Math.round(base * 100) / 100) : 0;
  if (!hasPerOptionPrice(product.variantAxes)) return basePrice;
  const variantPrice = resolvePriceForPick(product.variantAxes, variantPick);
  return variantPrice != null ? variantPrice : basePrice;
}

export function resolveEffectiveComparePrice(product, variantPick) {
  if (!product) return null;
  const base =
    product.comparePrice != null
      ? Number(product.comparePrice)
      : product.originalPrice != null
        ? Number(product.originalPrice)
        : null;
  const baseCompare = base != null && Number.isFinite(base) ? base : null;
  if (!hasPerOptionPrice(product.variantAxes)) return baseCompare;
  const variantCompare = resolveComparePriceForPick(product.variantAxes, variantPick);
  return variantCompare != null ? variantCompare : baseCompare;
}

export function getOptionDisplayPrice(variantAxes, pick, axisKey, optionIndex, product) {
  const testPick = { ...pick, [axisKey]: [optionIndex] };
  return resolveEffectivePrice(product, testPick);
}
