import React from 'react';
import OptimizedImage from './OptimizedImage';

/** Default intrinsic size for product cards (layout CSS constrains display; reduces CLS). */
export const PRODUCT_CARD_IMAGE_WIDTH = 640;
export const PRODUCT_CARD_IMAGE_HEIGHT = 640;

/**
 * Product listing image — lazy by default; pass priority for above-the-fold / LCP cards.
 */
export default function ProductImage({
  src,
  alt,
  className,
  width = PRODUCT_CARD_IMAGE_WIDTH,
  height = PRODUCT_CARD_IMAGE_HEIGHT,
  priority = false
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
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
    />
  );
}
