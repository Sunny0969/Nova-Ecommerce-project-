import { buildCategoryPath } from '../utils/urls';

/**
 * Blog quick-link labels → preferred shop category slugs (first match with products wins).
 * Slugs are ordered by semantic fit; only categories returned by GET /api/categories are used
 * (that endpoint excludes empty categories).
 */
export const BLOG_QUICK_LINK_SPECS = [
  { id: 'ql1', label: 'Shoe Care', slugs: ['cleaning-homecare', 'laundry', 'soaps-handwashes'] },
  { id: 'ql2', label: 'Laundry Essentials', slugs: ['laundry'] },
  { id: 'ql3', label: 'Device Care', slugs: ['cleaning-homecare', 'soaps-handwashes', 'personal-care'] },
  { id: 'ql4', label: 'Chargers & Cables', slugs: ['stationery-party-supplies', 'pet-care'] },
  { id: 'ql5', label: 'Ambient Lighting', slugs: ['wooden-handicrafts', 'blue-pottery', 'stationery-party-supplies'] },
  { id: 'ql6', label: 'Home Storage', slugs: ['jar-canned-foods', 'wooden-handicrafts', 'stationery-party-supplies'] },
  { id: 'ql7', label: 'Skincare Picks', slugs: ['personal-care', 'soaps-handwashes'] },
  { id: 'ql8', label: 'Hair Essentials', slugs: ['hair-care'] },
  { id: 'ql9', label: 'Run Essentials', slugs: ['clothing', 'personal-care'] },
  { id: 'ql10', label: 'Fitness Comfort', slugs: ['clothing', 'personal-care'] },
  { id: 'ql11', label: 'Everyday Style', slugs: ['clothing'] },
  { id: 'ql12', label: 'Seasonal Layers', slugs: ['clothing'] },
  { id: 'ql13', label: 'Fresh Home Cleaning', slugs: ['cleaning-homecare', 'soaps-handwashes'] },
  { id: 'ql14', label: 'Air Care Devices', slugs: ['tissues', 'cleaning-homecare'] },
  { id: 'ql15', label: 'Focus Desk Setup', slugs: ['stationery-party-supplies'] },
  { id: 'ql16', label: 'Coffee Corner Refresh', slugs: ['tea-coffee', 'beverages'] },
  { id: 'ql17', label: 'Morning Rituals', slugs: ['tea-coffee', 'milk-dairy', 'beverages'] },
  { id: 'ql18', label: 'Wardrobe Reset', slugs: ['clothing'] },
  { id: 'ql19', label: 'Styling Basics', slugs: ['clothing'] },
  { id: 'ql20', label: 'Glow Routines', slugs: ['personal-care', 'hair-care', 'soaps-handwashes'] },
  { id: 'ql21', label: 'Recovery Essentials', slugs: ['personal-care', 'baby-care', 'soaps-handwashes'] },
  { id: 'ql22', label: 'Checklist Gear', slugs: ['stationery-party-supplies'] },
  { id: 'ql23', label: 'Care That Lasts', slugs: ['personal-care', 'baby-care', 'hair-care'] },
  { id: 'ql24', label: 'Tech Simplified', slugs: ['stationery-party-supplies', 'cleaning-homecare'] }
];

/**
 * Resolve quick links to live categories that have published products.
 * @param {typeof BLOG_QUICK_LINK_SPECS} specs
 * @param {Array<{ slug?: string, name?: string, productCount?: number }>} categories
 */
export function resolveBlogQuickLinks(specs, categories) {
  const active = new Map();
  for (const cat of categories || []) {
    const slug = String(cat?.slug || '').trim().toLowerCase();
    if (!slug) continue;
    active.set(slug, cat);
  }

  return specs
    .map((spec) => {
      const matchedSlug = spec.slugs.find((s) => active.has(String(s).toLowerCase()));
      if (!matchedSlug) return null;
      const key = matchedSlug.toLowerCase();
      return {
        id: spec.id,
        label: spec.label,
        slug: key,
        url: buildCategoryPath(key)
      };
    })
    .filter(Boolean);
}
