/** Map API store settings → admin form strings (preserves 0; no silent fallbacks). */

function formatField(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : fallback;
}

function legacyTiersFromSettings(d) {
  const threshold = Number(d.weightShippingThresholdKg) || 1;
  const base = Number(d.shippingUpToThresholdKg) || 199;
  const extra = Number(d.shippingAdditionalPerKgOver) || 121;
  return [
    { id: 'legacy-1', minKg: '0', maxKg: String(threshold), price: String(base) },
    {
      id: 'legacy-2',
      minKg: String(Math.round((threshold + 0.01) * 100) / 100),
      maxKg: String(Math.round((threshold + 1) * 100) / 100),
      price: String(base + extra)
    }
  ];
}

function tiersToForm(tiers, legacyDoc) {
  if (Array.isArray(tiers) && tiers.length) {
    return tiers.map((t, i) => ({
      id: `tier-${i}-${t.minKg}-${t.maxKg}`,
      minKg: formatField(t.minKg, '0'),
      maxKg: formatField(t.maxKg, '1'),
      price: formatField(t.price, '0')
    }));
  }
  return legacyTiersFromSettings(legacyDoc || {});
}

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
    defaultProductWeightKg: formatField(d.defaultProductWeightKg, '1'),
    weightShippingTiers: tiersToForm(d.weightShippingTiers, d)
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
    defaultProductWeightKg: '1',
    weightShippingTiers: [
      { id: 'tier-1', minKg: '0', maxKg: '1', price: '199' },
      { id: 'tier-2', minKg: '1.01', maxKg: '2', price: '320' },
      { id: 'tier-3', minKg: '2.01', maxKg: '3', price: '441' }
    ]
  };
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

function parseTierRow(row, index) {
  const label = `Weight tier ${index + 1}`;
  return {
    minKg: parseFormNumber(row.minKg, `${label} — from (kg)`),
    maxKg: parseFormNumber(row.maxKg, `${label} — to (kg)`),
    price: parseFormNumber(row.price, `${label} — price`)
  };
}

/** Admin form → API payload */
export function formToStoreSettingsPayload(form) {
  const taxPercent = parseFormNumber(form.taxPercent, 'Sales tax');
  const tiers = (form.weightShippingTiers || []).map((row, i) => parseTierRow(row, i));

  for (let i = 0; i < tiers.length; i += 1) {
    if (tiers[i].maxKg < tiers[i].minKg) {
      throw new Error(`Weight tier ${i + 1}: max kg must be ≥ min kg`);
    }
    if (i > 0 && tiers[i].minKg <= tiers[i - 1].maxKg) {
      throw new Error(`Weight tier ${i + 1} overlaps tier ${i}`);
    }
  }

  return {
    freeShippingMin: parseFormNumber(form.freeShippingMin, 'Free shipping minimum'),
    shippingStandard: parseFormNumber(form.shippingStandard, 'Flat standard shipping'),
    shippingExpress: parseFormNumber(form.shippingExpress, 'Express shipping'),
    shippingNextDay: parseFormNumber(form.shippingNextDay, 'Next-day shipping'),
    taxRate: Math.min(100, Math.max(0, taxPercent)) / 100,
    weightShippingEnabled: Boolean(form.weightShippingEnabled),
    defaultProductWeightKg: Math.max(
      0.01,
      parseFormNumber(form.defaultProductWeightKg, 'Default product weight')
    ),
    weightShippingTiers: tiers
  };
}

export function newWeightTierRow() {
  return {
    id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    minKg: '',
    maxKg: '',
    price: ''
  };
}
