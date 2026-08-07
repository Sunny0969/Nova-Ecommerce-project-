/**
 * Internal linking — topical clusters, keyword-rich anchors, 2–5 links per content block.
 */
import { buildBrandPath, buildCategoryPath } from '../utils/urls';

/** Pillar → cluster links on category shop pages */
export const CATEGORY_CLUSTER_LINKS = {
  'cleaning-homecare': [
    { slug: 'laundry', label: 'Buy laundry detergent online in Pakistan' },
    { slug: 'soaps-handwashes', label: 'Soaps & handwash for daily hygiene' },
    { slug: 'tissues', label: 'Tissues & wipes for home & office' }
  ],
  laundry: [
    { slug: 'cleaning-homecare', label: 'Home cleaning & disinfectants' },
    { slug: 'soaps-handwashes', label: 'Handwash & body soap deals' },
    { slug: 'personal-care', label: 'Personal care essentials online' }
  ],
  'soaps-handwashes': [
    { slug: 'personal-care', label: 'Personal care products online' },
    { slug: 'hair-care', label: 'Hair care shampoos & conditioners' },
    { slug: 'cleaning-homecare', label: 'Household cleaning supplies' }
  ],
  'hair-care': [
    { slug: 'personal-care', label: 'Shop personal care online' },
    { slug: 'soaps-handwashes', label: 'Soaps & handwash collection' },
    { slug: 'beauty', label: 'Beauty & skincare picks' }
  ],
  'milk-dairy': [
    { slug: 'breakfast', label: 'Breakfast cereals & spreads' },
    { slug: 'beverages', label: 'Juices & soft drinks online' },
    { slug: 'tea-coffee', label: 'Tea & coffee for every routine' }
  ],
  rice: [
    { slug: 'pulses', label: 'Pulses & lentils online' },
    { slug: 'oil-ghee', label: 'Cooking oil & ghee deals' },
    { slug: 'spices-sauces', label: 'Spices & cooking sauces' }
  ],
  'tea-coffee': [
    { slug: 'beverages', label: 'Beverages & drink mixes' },
    { slug: 'breakfast', label: 'Breakfast essentials online' },
    { slug: 'snacks-confectionary', label: 'Snacks & confectionery' }
  ],
  beverages: [
    { slug: 'tea-coffee', label: 'Tea & coffee online Pakistan' },
    { slug: 'milk-dairy', label: 'Milk & dairy products' },
    { slug: 'snacks-confectionary', label: 'Snacks to pair with drinks' }
  ],
  breakfast: [
    { slug: 'milk-dairy', label: 'Fresh milk & dairy online' },
    { slug: 'tea-coffee', label: 'Morning tea & coffee picks' },
    { slug: 'snacks-confectionary', label: 'Breakfast snacks & spreads' }
  ],
  'oil-ghee': [
    { slug: 'rice', label: 'Basmati & everyday rice online' },
    { slug: 'spices-sauces', label: 'Spices for Pakistani cooking' },
    { slug: 'pulses', label: 'Daal & pulses delivery' }
  ],
  'spices-sauces': [
    { slug: 'rice', label: 'Rice for biryani & pulao' },
    { slug: 'oil-ghee', label: 'Cooking oil & desi ghee' },
    { slug: 'chicken-meat', label: 'Chicken & meat for curries' }
  ],
  pulses: [
    { slug: 'rice', label: 'Rice & grains online' },
    { slug: 'oil-ghee', label: 'Oils for tadka & frying' },
    { slug: 'spices-sauces', label: 'Masala & sauce essentials' }
  ],
  'fruits-vegetables': [
    { slug: 'frozen', label: 'Frozen fruits & vegetables' },
    { slug: 'chicken-meat', label: 'Fresh chicken & meat online' },
    { slug: 'milk-dairy', label: 'Dairy & fresh essentials' }
  ],
  'chicken-meat': [
    { slug: 'frozen', label: 'Frozen meat & ready meals' },
    { slug: 'spices-sauces', label: 'BBQ & karahi masala mixes' },
    { slug: 'fruits-vegetables', label: 'Fresh produce for sides' }
  ],
  frozen: [
    { slug: 'chicken-meat', label: 'Chicken & meat deals' },
    { slug: 'snacks-confectionary', label: 'Frozen snacks & treats' },
    { slug: 'fruits-vegetables', label: 'Fresh grocery delivery' }
  ],
  'personal-care': [
    { slug: 'hair-care', label: 'Hair care online at Bazaar' },
    { slug: 'soaps-handwashes', label: 'Soaps & handwash range' },
    { slug: 'baby-care', label: 'Baby care & diapers' }
  ],
  'baby-care': [
    { slug: 'personal-care', label: 'Family personal care products' },
    { slug: 'tissues', label: 'Baby wipes & tissues' },
    { slug: 'laundry', label: 'Gentle laundry for baby clothes' }
  ],
  'snacks-confectionary': [
    { slug: 'beverages', label: 'Drinks & beverage combos' },
    { slug: 'breakfast', label: 'Breakfast & bakery snacks' },
    { slug: 'tea-coffee', label: 'Tea-time snack pairings' }
  ],
  'pet-care': [
    { slug: 'pet-electric-clippers', label: 'Pet grooming clippers online' },
    { slug: 'leashes-harnesses', label: 'Pet leashes & harnesses' },
    { slug: 'cleaning-homecare', label: 'Home cleaning for pet owners' }
  ],
  flour: [
    { slug: 'breakfast', label: 'Breakfast & baking essentials' },
    { slug: 'oil-ghee', label: 'Cooking oil for roti & paratha' },
    { slug: 'dessert-baking-essentials', label: 'Dessert & baking supplies' }
  ],
  sugar: [
    { slug: 'tea-coffee', label: 'Tea & coffee sweeteners' },
    { slug: 'dessert-baking-essentials', label: 'Baking sugar & essentials' },
    { slug: 'beverages', label: 'Drink mixes & beverages' }
  ]
};

/** Blog journal category → shop topic cluster (5 links max) */
export const BLOG_TOPIC_CLUSTERS = {
  care: [
    { to: buildCategoryPath('cleaning-homecare'), label: 'Home cleaning products online' },
    { to: buildCategoryPath('laundry'), label: 'Laundry detergent & fabric care' },
    { to: buildCategoryPath('soaps-handwashes'), label: 'Soaps & handwash deals' },
    { to: '/blog', label: 'More home care shopping guides' },
    { to: '/shop', label: 'Shop groceries & essentials online' }
  ],
  tech: [
    { to: buildCategoryPath('electronics'), label: 'Electronics & gadgets online' },
    { to: buildCategoryPath('screen-protectors'), label: 'Screen protectors & device care' },
    { to: buildCategoryPath('3d-printers'), label: '3D printers & accessories' },
    { to: '/blog', label: 'Tech buying guides on Bazaar blog' },
    { to: '/brands', label: 'Shop trusted electronics brands' }
  ],
  home: [
    { to: buildCategoryPath('cleaning-homecare'), label: 'Cleaning & homecare supplies' },
    { to: buildCategoryPath('stationery-party-supplies'), label: 'Stationery & party supplies' },
    { to: buildCategoryPath('tissues'), label: 'Tissues & household disposables' },
    { to: '/blog', label: 'Home refresh guides & tips' },
    { to: '/shop', label: 'Browse full Bazaar catalog' }
  ],
  fashion: [
    { to: '/shop', label: 'Everyday fashion & lifestyle picks' },
    { to: buildCategoryPath('personal-care'), label: 'Personal care for your routine' },
    { to: '/blog', label: 'Style guides on Bazaar journal' },
    { to: '/brands', label: 'Popular fashion & lifestyle brands' },
    { to: buildCategoryPath('snacks-confectionary'), label: 'Snacks for busy days out' }
  ],
  beauty: [
    { to: buildCategoryPath('personal-care'), label: 'Personal care & skincare online' },
    { to: buildCategoryPath('hair-care'), label: 'Hair care shampoos & treatments' },
    { to: buildCategoryPath('soaps-handwashes'), label: 'Soaps & gentle cleansers' },
    { to: '/blog', label: 'Beauty routine guides & tips' },
    { to: '/shop', label: 'Shop beauty essentials at Bazaar' }
  ],
  sports: [
    { to: buildCategoryPath('sport'), label: 'Sports & fitness essentials' },
    { to: buildCategoryPath('personal-care'), label: 'Recovery & personal care' },
    { to: buildCategoryPath('beverages'), label: 'Hydration & sports drinks' },
    { to: '/blog', label: 'Fitness & recovery guides' },
    { to: '/shop', label: 'Shop active lifestyle products' }
  ],
  default: [
    { to: '/shop', label: 'Shop groceries & lifestyle online' },
    { to: '/blog', label: 'Bazaar shopping guides & journal' },
    { to: '/brands', label: 'Browse brands at Bazaar' },
    { to: '/about-us', label: 'About Bazaar online store Pakistan' },
    { to: '/contact-us', label: 'Contact Bazaar customer support' }
  ]
};

/** Trust & policy cross-links (keyword-rich anchors) */
export const LEGAL_INTERNAL_LINKS = [
  { to: '/about-us', label: 'About Bazaar online grocery in Pakistan' },
  { to: '/faqs', label: 'Delivery, orders & payment FAQs' },
  { to: '/privacy-policy', label: 'Privacy policy & data protection' },
  { to: '/terms-and-conditions', label: 'Terms & conditions for online orders' },
  { to: '/returns-and-refunds', label: 'Returns & refunds policy' },
  { to: '/shipping-policy', label: 'Shipping & delivery policy' },
  { to: '/contact-us', label: 'Contact Bazaar support in Hyderabad' },
  { to: '/shop', label: 'Shop groceries & essentials online' }
];

export function getClusterLinksForCategory(slug) {
  return CATEGORY_CLUSTER_LINKS[String(slug || '').toLowerCase()] || [];
}

export function getClusterLinksResolved(slug) {
  return getClusterLinksForCategory(slug).map((item) => ({
    to: buildCategoryPath(item.slug),
    label: item.label
  }));
}

export function getBlogTopicCluster(blog) {
  const raw = String(blog?.category || '')
    .trim()
    .toLowerCase();
  const keyMap = {
    care: 'care',
    tech: 'tech',
    home: 'home',
    fashion: 'fashion',
    beauty: 'beauty',
    sports: 'sports',
    sport: 'sports'
  };
  return BLOG_TOPIC_CLUSTERS[keyMap[raw] || raw] || BLOG_TOPIC_CLUSTERS.default;
}

/** 2–5 contextual links for a blog article */
export function getBlogRelatedLinks(blog) {
  const links = [];
  const dest = String(blog?.destinationUrl || '').trim();
  const destLabel = String(blog?.destinationLabel || '').trim();

  if (destLabel && dest) {
    links.push({
      to: dest,
      label: `Shop ${destLabel} online at Bazaar`
    });
  }

  const related = Array.isArray(blog?.relatedPosts) ? blog.relatedPosts : [];
  related.slice(0, 2).forEach((post) => {
    if (!post?.slug) return;
    links.push({
      to: `/blog/${post.slug}`,
      label: post.title || 'Related shopping guide'
    });
  });

  const catMatch = dest.match(/\/shop\/category\/([^/?#]+)/i);
  if (catMatch) {
    getClusterLinksResolved(catMatch[1])
      .slice(0, 2)
      .forEach((item) => links.push(item));
  }

  const topicLinks = getBlogTopicCluster(blog).filter(
    (item) => !links.some((l) => l.to === item.to)
  );
  topicLinks.slice(0, 5 - links.length).forEach((item) => links.push(item));

  return links.slice(0, 5);
}

/** Product detail page — category cluster + brand */
export function getProductDetailLinks({ categorySlug, categoryName, brandSlug, brandName }) {
  const links = [];
  const catSlug = String(categorySlug || '').toLowerCase();
  const catLabel = String(categoryName || catSlug || 'category').trim();

  if (catSlug) {
    links.push({
      to: buildCategoryPath(catSlug),
      label: `Buy ${catLabel} online at Bazaar`
    });
    getClusterLinksResolved(catSlug)
      .slice(0, 3)
      .forEach((item) => {
        if (!links.some((l) => l.to === item.to)) links.push(item);
      });
  }

  if (brandSlug && brandName) {
    links.push({
      to: buildBrandPath(brandSlug),
      label: `More ${brandName} products online`
    });
  }

  if (!links.some((l) => l.to === '/shop')) {
    links.push({ to: '/shop', label: 'Shop groceries & essentials online' });
  }

  return links.slice(0, 5);
}

export function getLegalInternalLinks(excludePath) {
  const skip = String(excludePath || '').trim();
  return LEGAL_INTERNAL_LINKS.filter((item) => item.to !== skip).slice(0, 5);
}

/** About & homepage content hubs */
export const ABOUT_INTERNAL_LINKS = [
  { to: '/shop', label: 'Shop groceries & daily essentials online' },
  { to: '/#categories', label: 'Browse all grocery categories' },
  { to: '/brands', label: 'Shop trusted household brands' },
  { to: '/blog', label: 'Shopping guides & care tips' },
  { to: '/faqs', label: 'Delivery & order FAQs' }
];
