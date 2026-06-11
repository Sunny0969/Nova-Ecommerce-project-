import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { parseShopPath } from '../../utils/urls';
import ProductDetailPageSkeleton from './ProductDetailPageSkeleton';
import ShopPageSkeleton from './ShopPageSkeleton';
import HomePageSkeleton from './HomePageSkeleton';
import GenericPageSkeleton from './GenericPageSkeleton';

function resolveSkeletonKind(pathname = '') {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  const { categorySlug, productSlug } = parseShopPath(path);

  if (productSlug || /^\/shop\/[^/]+$/i.test(path)) {
    return 'product';
  }
  if (
    path === '/shop' ||
    path.startsWith('/brand/') ||
    (categorySlug && !productSlug)
  ) {
    return 'shop';
  }
  if (path === '/' || path === '/home') {
    return 'home';
  }
  if (path.startsWith('/blog')) {
    return 'blog';
  }
  if (path === '/cart' || path.startsWith('/checkout')) {
    return 'cart';
  }
  return 'generic';
}

/**
 * Route-level Suspense fallback — layout skeleton matched to destination page.
 */
export default function PageSuspenseFallback() {
  const { pathname } = useLocation();
  const kind = useMemo(() => resolveSkeletonKind(pathname), [pathname]);

  switch (kind) {
    case 'product':
      return <ProductDetailPageSkeleton />;
    case 'shop':
      return <ShopPageSkeleton />;
    case 'home':
      return <HomePageSkeleton />;
    case 'blog':
      return <GenericPageSkeleton label="Loading blog" />;
    case 'cart':
      return <GenericPageSkeleton label="Loading cart" />;
    default:
      return <GenericPageSkeleton />;
  }
}
