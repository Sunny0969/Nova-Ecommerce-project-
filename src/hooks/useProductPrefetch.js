import { useCallback, useRef } from 'react';
import { prefetchProductPage } from '../lib/prefetchProduct';

/**
 * Stable handlers for product card links — prefetch once per slug per mount.
 * @param {string} slug
 */
export function useProductPrefetch(slug) {
  const warmed = useRef(false);

  const warm = useCallback(() => {
    const s = slug || '';
    if (!s || warmed.current) return;
    warmed.current = true;
    prefetchProductPage(s);
  }, [slug]);

  return {
    onMouseEnter: warm,
    onFocus: warm,
    onTouchStart: warm
  };
}
