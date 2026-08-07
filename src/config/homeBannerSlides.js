/**
 * Homepage promo slider — Cloudinary CDN (responsive) with local JPG fallback.
 */
import summerSaleBanner from '../assets/images/slider/summer-sale.jpg';
import image03Banner from '../assets/images/slider/image-03.jpg';
import petStoreBanner from '../assets/images/slider/pet-store.jpg';
import bannerCloudinary from './homeBannerCloudinary.json';

const SLIDE_DEFINITIONS = [
  {
    key: 'summer-sale',
    alt: 'Summer Sale — Flat 20% off at Bazaar',
    href: '/shop',
    local: summerSaleBanner
  },
  {
    key: 'image-03',
    alt: 'Shop groceries and essentials at Bazaar',
    href: '/shop',
    local: image03Banner
  },
  {
    key: 'pet-store',
    alt: 'Pet food — 20% discount at Bazaar',
    href: '/shop',
    local: petStoreBanner
  }
];

export const HOME_BANNER_SLIDES = SLIDE_DEFINITIONS.map((def) => {
  const cloud = bannerCloudinary[def.key];
  return {
    alt: def.alt,
    href: def.href,
    src: cloud?.url || def.local,
    cloudinaryPublicId: cloud?.public_id || null
  };
});

export const HOME_BANNER_INTERVAL_MS = 5000;

/** Normalized slider assets — keeps width/height on <img> for CLS. */
export const HOME_BANNER_WIDTH = 1920;
export const HOME_BANNER_HEIGHT = 575;

/** Responsive srcSet widths for hero banners. */
export const HOME_BANNER_SRC_WIDTHS = [600, 1200, 1920];

export const HOME_BANNER_SIZES =
  '(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1920px';
