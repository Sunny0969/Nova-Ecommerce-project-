/**
 * Homepage promo slider — banners in `src/assets/images/slider/` (1920×575).
 */
import summerSaleBanner from '../assets/images/slider/summer-sale.jpg';
import image03Banner from '../assets/images/slider/image-03.jpg';
import petStoreBanner from '../assets/images/slider/pet-store.jpg';

export const HOME_BANNER_SLIDES = [
  {
    src: summerSaleBanner,
    alt: 'Summer Sale — Flat 20% off at Bazaar',
    href: '/shop'
  },
  {
    src: image03Banner,
    alt: 'Shop groceries and essentials at Bazaar',
    href: '/shop'
  },
  {
    src: petStoreBanner,
    alt: 'Pet food — 20% discount at Bazaar',
    href: '/shop'
  }
];

export const HOME_BANNER_INTERVAL_MS = 5000;

/** Normalized slider assets — keeps width/height on <img> for CLS. */
export const HOME_BANNER_WIDTH = 1920;
export const HOME_BANNER_HEIGHT = 575;
