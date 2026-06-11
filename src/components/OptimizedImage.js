import React from 'react';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';

/**
 * SEO-friendly image: descriptive alt, explicit dimensions (CLS), native lazy/eager loading.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt — required for meaningful images; use "" only when decorative
 * @param {number} props.width
 * @param {number} props.height
 * @param {'lazy'|'eager'} [props.loading]
 * @param {boolean} [props.priority] — LCP: eager + fetchPriority high
 * @param {boolean} [props.optimize] — run optimizeImageUrl (WebP-friendly CDN params)
 * @param {number} [props.optimizeWidth] — resize hint passed to optimizeImageUrl
 */
export default function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  loading,
  priority = false,
  optimize = true,
  optimizeWidth,
  sizes,
  className,
  decoding = 'async',
  ...rest
}) {
  if (!src) return null;

  const resolvedSrc =
    optimize && typeof src === 'string'
      ? optimizeImageUrl(src, { width: optimizeWidth || width || 800 })
      : src;

  const loadMode = priority ? 'eager' : loading || 'lazy';

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loadMode}
      decoding={decoding}
      {...(priority ? { fetchpriority: 'high' } : {})}
      sizes={sizes}
      className={className}
      {...rest}
    />
  );
}
