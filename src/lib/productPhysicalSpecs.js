/**
 * Size & weight from Punjab Handicrafts catalog (blue-pottery).
 * Used when API product docs do not yet have these fields populated.
 */
export const BLUE_POTTERY_SPECS = {
  'rice-plater-dish': { size: '14×9.5 inch', weight: '1.6 kg' },
  'dunga-ii': { size: '9×8 inch', weight: '1.20 kg' },
  'donga-ii': { size: '9×8 inch', weight: '1.20 kg' },
  'dish-4': { size: '9×9 inch' },
  'blue-pottery-dish': { size: '9×9 inch' },
  'ash-tray0': { size: '4×4.7 inch', weight: '280 g' },
  'ash-tray': { size: '4×4.7 inch', weight: '280 g' },
  'dry-fruit-dish-iii': { size: '8×8 inch', weight: '500 g' },
  'dry-fruit-dish-30': { size: '8×8 inch', weight: '500 g' },
  'dry-fruit-dish-ii-1': { size: '7×12 inch', weight: '745 g' },
  'dry-fruit-dish-ii': { size: '7×12 inch', weight: '745 g' },
  'half-gamla-6': { size: '5 inch', weight: '660 g' },
  'half-gamla-46': { size: '5 inch', weight: '660 g' },
  'tiny-vase': { size: '4×3 inch' },
  'blue-potter-vase': { size: '4×3 inch' }
};

function isBluePotteryProduct(product) {
  const cat = String(product?.categorySlug || product?.category || '').toLowerCase();
  if (cat === 'blue-pottery') return true;
  const tags = Array.isArray(product?.tags) ? product.tags : [];
  return tags.some((t) => String(t).toLowerCase() === 'blue-pottery');
}

/** Resolved size/weight for display (API value first, then blue-pottery fallback). */
export function getProductPhysicalSpecs(product) {
  if (!product) return { size: '', weight: '' };

  let size = product.size != null ? String(product.size).trim() : '';
  let weight = product.weight != null ? String(product.weight).trim() : '';

  if ((!size || !weight) && isBluePotteryProduct(product)) {
    const key = String(product.slug || product.productId || '').toLowerCase();
    const fallback = BLUE_POTTERY_SPECS[key];
    if (fallback) {
      if (!size && fallback.size) size = fallback.size;
      if (!weight && fallback.weight) weight = fallback.weight;
    }
  }

  return { size, weight };
}
