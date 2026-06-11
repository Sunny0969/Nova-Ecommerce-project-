/** Map API store settings → admin form strings (preserves 0; no silent fallbacks). */
export function storeSettingsToForm(d) {
  if (!d || typeof d !== 'object') {
    return emptyStoreSettingsForm();
  }
  const taxPct = Math.round((Number(d.taxRate) || 0) * 10000) / 100;
  return {
    freeShippingMin: formatField(d.freeShippingMin),
    shippingStandard: formatField(d.shippingStandard),
    shippingExpress: formatField(d.shippingExpress),
    shippingNextDay: formatField(d.shippingNextDay),
    taxPercent: formatField(taxPct),
    weightShippingEnabled: d.weightShippingEnabled !== false,
    weightShippingThresholdKg: formatField(d.weightShippingThresholdKg, '1'),
    shippingUpToThresholdKg: formatField(d.shippingUpToThresholdKg, '300'),
    shippingAdditionalPerKgOver: formatField(d.shippingAdditionalPerKgOver, '150'),
    defaultProductWeightKg: formatField(d.defaultProductWeightKg, '1')
  };
}

export function emptyStoreSettingsForm() {
  return {
    freeShippingMin: '2026',
    shippingStandard: '299',
    shippingExpress: '499',
    shippingNextDay: '599',
    taxPercent: '0',
    weightShippingEnabled: true,
    weightShippingThresholdKg: '1',
    shippingUpToThresholdKg: '300',
    shippingAdditionalPerKgOver: '150',
    defaultProductWeightKg: '1'
  };
}

function formatField(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : fallback;
}

export function parseFormNumber(value, label) {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    throw new Error(`${label} is required`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${label} must be a valid number`);
  }
  return n;
}

/** Admin form → API payload */
export function formToStoreSettingsPayload(form) {
  const taxPercent = parseFormNumber(form.taxPercent, 'Sales tax');
  return {
    freeShippingMin: parseFormNumber(form.freeShippingMin, 'Free shipping minimum'),
    shippingStandard: parseFormNumber(form.shippingStandard, 'Flat standard shipping'),
    shippingExpress: parseFormNumber(form.shippingExpress, 'Express shipping'),
    shippingNextDay: parseFormNumber(form.shippingNextDay, 'Next-day shipping'),
    taxRate: Math.min(100, Math.max(0, taxPercent)) / 100,
    weightShippingEnabled: Boolean(form.weightShippingEnabled),
    weightShippingThresholdKg: Math.max(
      0.01,
      parseFormNumber(form.weightShippingThresholdKg, 'Weight threshold')
    ),
    shippingUpToThresholdKg: parseFormNumber(form.shippingUpToThresholdKg, 'Shipping up to threshold'),
    shippingAdditionalPerKgOver: parseFormNumber(
      form.shippingAdditionalPerKgOver,
      'Additional per kg'
    ),
    defaultProductWeightKg: Math.max(
      0.01,
      parseFormNumber(form.defaultProductWeightKg, 'Default product weight')
    )
  };
}
