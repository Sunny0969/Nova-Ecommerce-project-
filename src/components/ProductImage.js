import React from 'react';
import OptimizedImage from './OptimizedImage';

/** Product grid cards — smaller CDN payload than w_800. */
export const PRODUCT_CARD_IMAGE_WIDTH = 400;
export const PRODUCT_CARD_IMAGE_HEIGHT = 400;

/** Flash sale row — tighter width for 8-column desktop grid. */
export const FLASH_SALE_IMAGE_WIDTH = 320;
export const FLASH_SALE_IMAGE_HEIGHT = 320;

/**
 * Product listing image — lazy by default; pass priority for above-the-fold / LCP cards.
 */
export default function ProductImage({
  src,
  alt,
  className,
  width = PRODUCT_CARD_IMAGE_WIDTH,
  height = PRODUCT_CARD_IMAGE_HEIGHT,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px'
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      priority={priority}
      optimizeWidth={width}
      sizes={sizes}
    />
  );
}
