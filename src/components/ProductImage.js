import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';


/** Default intrinsic size for product cards (layout CSS constrains display; reduces CLS). */
export const PRODUCT_CARD_IMAGE_WIDTH = 640;
export const PRODUCT_CARD_IMAGE_HEIGHT = 640;

/**
 * Product listing image: lazy + blur placeholder.
 * Omit width/height so the image fills its positioned parent (object-fit: cover via CSS).
 * Pass numeric width/height when you need intrinsic dimensions (e.g. related-product thumbnails).
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {boolean} [props.priority] — eager load (e.g. first featured card)
 */
export default function ProductImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false
}) {
  const fillParent = width == null && height == null;
  const w = fillParent ? '100%' : width ?? PRODUCT_CARD_IMAGE_WIDTH;
  const h = fillParent ? '100%' : height ?? PRODUCT_CARD_IMAGE_HEIGHT;

  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      effect="blur"
      className={className}
      width={w}
      height={h}
      visibleByDefault={priority}
      decoding="async"
    />
  );
}
