/**
 * Storefront currency — displayed prices use PKR (Pakistani Rupee).
 * Amounts in the API/database are unchanged; only presentation changes.
 */

const intlPKR = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatPKR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return intlPKR.format(0);
  return intlPKR.format(n);
}

/** Short labels for chart axes (e.g. PKR 12k). */
export function formatPKRChartTick(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const av = Math.abs(n);
  if (av >= 1_000_000) {
    const x = n / 1_000_000;
    const s = Number.isInteger(x) ? String(x) : x.toFixed(1);
    return `PKR ${s}M`;
  }
  if (av >= 1000) {
    const k = n / 1000;
    const s = Math.abs(k % 1) < 0.01 || Math.abs(k % 1 - 1) < 0.01 ? String(Math.round(k)) : k.toFixed(1);
    return `PKR ${s}k`;
  }
  return formatPKR(n);
}
