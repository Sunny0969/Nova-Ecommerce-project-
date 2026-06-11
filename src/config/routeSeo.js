import { buildMetaDescription, buildMetaKeywords, buildPageTitle } from '../utils/pageSeo';

/** Homepage — keep in sync with `public/index.html` first-paint meta tags. */
export const homeRouteSeo = {
  title: buildPageTitle('Online Shopping Pakistan', 'Groceries & Essentials'),
  description: buildMetaDescription(
    'online shopping Pakistan',
    'Shop groceries, cleaning, tea, rice, fashion & electronics with fast delivery from Hyderabad.',
    'Bazaar — quality products, secure checkout, nationwide delivery.'
  ),
  keywords: buildMetaKeywords(
    'online shopping Pakistan',
    'grocery delivery',
    'Bazaar',
    'Hyderabad',
    'groceries online',
    'fast delivery'
  )
};

/** Static paths → SEO applied before lazy route chunks load (prevents title flash). */
export const ROUTE_SEO_BY_PATH = {
  '/': homeRouteSeo,
  '/home': homeRouteSeo,
  '/shop': {
    title: buildPageTitle('Shop Online Pakistan', 'Groceries & Lifestyle'),
    description: buildMetaDescription(
      'Online shopping Pakistan',
      'Browse groceries, homecare, fashion, and electronics with secure payment.',
      'Bazaar — curated products delivered across Pakistan.'
    ),
    keywords: buildMetaKeywords('shop online Pakistan', 'groceries', 'Bazaar', 'online store', 'fast delivery')
  },
  '/blog': {
    title: buildPageTitle('Shopping Guides & Tips', 'Blog'),
    description: buildMetaDescription(
      'shopping guides Pakistan',
      'Read tips on groceries, fashion, and home essentials.',
      'Bazaar blog — practical advice for smarter online shopping.'
    ),
    keywords: buildMetaKeywords('Bazaar blog', 'shopping guides Pakistan', 'online shopping tips')
  },
  '/brands': {
    title: buildPageTitle('Shop by Brand', 'Groceries & Essentials'),
    description: buildMetaDescription(
      'grocery brands Pakistan',
      'Browse trusted brands across food, home, and personal care.',
      'Bazaar — shop by brand with fast delivery.'
    ),
    keywords: buildMetaKeywords('shop by brand', 'grocery brands Pakistan', 'Bazaar')
  },
  '/about-us': {
    title: buildPageTitle('About Us', 'Online Grocery Pakistan'),
    description: buildMetaDescription(
      'Bazaar online store',
      'Learn about our mission, delivery, and customer service.',
      'About Bazaar — online shopping Pakistan with trusted quality.'
    ),
    keywords: buildMetaKeywords('About Bazaar', 'online grocery Pakistan', 'Hyderabad')
  },
  '/contact-us': {
    title: buildPageTitle('Contact Us', 'Bazaar'),
    description: buildMetaDescription(
      'contact Bazaar',
      'Reach our team for orders, delivery, and product questions.',
      'Contact Bazaar customer support in Hyderabad, Pakistan.'
    ),
    keywords: buildMetaKeywords('contact Bazaar', 'customer support', 'Hyderabad')
  },
  '/faqs': {
    title: buildPageTitle('FAQs', 'Bazaar'),
    description: buildMetaDescription(
      'Bazaar FAQs',
      'Answers on delivery, returns, payments, and orders.',
      'Frequently asked questions about shopping at Bazaar.'
    ),
    keywords: buildMetaKeywords('Bazaar FAQ', 'delivery', 'returns', 'online shopping Pakistan')
  },
  '/privacy-policy': {
    title: buildPageTitle('Privacy Policy', 'Bazaar'),
    description: buildMetaDescription(
      'Bazaar privacy policy',
      'How we collect, use, and protect your personal data.',
      'Read the Bazaar privacy policy for online shoppers in Pakistan.'
    ),
    keywords: buildMetaKeywords('privacy policy', 'Bazaar', 'data protection')
  },
  '/terms-and-conditions': {
    title: buildPageTitle('Terms and Conditions', 'Bazaar'),
    description: buildMetaDescription(
      'Bazaar terms and conditions',
      'Rules for using our website, placing orders, and returns.',
      'Terms and conditions for shopping at Bazaar online.'
    ),
    keywords: buildMetaKeywords('terms and conditions', 'Bazaar', 'online shopping')
  }
};

/**
 * @param {string} pathname
 * @returns {{ title: string, description: string, keywords?: string } | null}
 */
export function getRouteSeo(pathname = '') {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  return ROUTE_SEO_BY_PATH[path] || null;
}
