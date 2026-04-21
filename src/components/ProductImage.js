import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';


/** Default intrinsic size for product cards (layout CSS constrains display; reduces CLS). */
export const PRODUCT_CARD_IMAGE_WIDTH = 640;
export const PRODUCT_CARD_IMAGE_HEIGHT = 640;

/**
 * Product listing image: lazy + blur placeholder + explicit dimensions for CLS.
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
  width = PRODUCT_CARD_IMAGE_WIDTH,
  height = PRODUCT_CARD_IMAGE_HEIGHT,
  priority = false
}) {
  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      effect="blur"
      className={className}
      width={width}
      height={height}
      visibleByDefault={priority}
      decoding="async"
    />
  );
}
