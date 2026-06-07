/**
 * Pillar → cluster internal links (topical map implementation).
 * Used on category shop pages for contextual linking.
 */
export const CATEGORY_CLUSTER_LINKS = {
  'cleaning-homecare': [
    { slug: 'laundry', label: 'Laundry detergents' },
    { slug: 'soaps-handwashes', label: 'Soaps & handwash' },
    { slug: 'tissues', label: 'Tissues & wipes' }
  ],
  'hair-care': [
    { slug: 'personal-care', label: 'Personal care' },
    { slug: 'soaps-handwashes', label: 'Soaps & handwash' }
  ],
  'milk-dairy': [
    { slug: 'breakfast', label: 'Breakfast essentials' },
    { slug: 'beverages', label: 'Beverages' }
  ],
  'rice': [
    { slug: 'pulses', label: 'Pulses & lentils' },
    { slug: 'oil-ghee', label: 'Cooking oil & ghee' },
    { slug: 'spices-sauces', label: 'Spices & sauces' }
  ],
  'tea-coffee': [
    { slug: 'beverages', label: 'Beverages' },
    { slug: 'breakfast', label: 'Breakfast' },
    { slug: 'snacks-confectionary', label: 'Snacks' }
  ],
  'fruits-vegetables': [
    { slug: 'frozen', label: 'Frozen foods' },
    { slug: 'chicken-meat', label: 'Chicken & meat' }
  ],
  'personal-care': [
    { slug: 'hair-care', label: 'Hair care' },
    { slug: 'soaps-handwashes', label: 'Soaps & handwash' }
  ],
  'pet-care': [
    { slug: 'pet-electric-clippers', label: 'Pet clippers' },
    { slug: 'leashes-harnesses', label: 'Leashes & harnesses' }
  ]
};

export function getClusterLinksForCategory(slug) {
  return CATEGORY_CLUSTER_LINKS[String(slug || '').toLowerCase()] || [];
}
