import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  buildBrandPath,
  buildCategoryPath,
  categoriesFromSearchParams,
  shopFiltersOnlyQuery,
  shouldStayOnLegacyShopQuery
} from '../utils/urls';

/** Preserves filters when redirecting /products → /shop (or clean category/brand paths) */
export default function LegacyShopRedirect() {
  const [searchParams] = useSearchParams();
  const cats = categoriesFromSearchParams(searchParams);
  const brand = (searchParams.get('brand') || '').trim().toLowerCase();
  const q = shopFiltersOnlyQuery(searchParams);
  const suffix = q ? `?${q}` : '';

  if (!shouldStayOnLegacyShopQuery(searchParams)) {
    if (cats.length === 1 && !brand) {
      return <Navigate to={`${buildCategoryPath(cats[0])}${suffix}`} replace />;
    }
    if (brand && cats.length === 0) {
      return <Navigate to={`${buildBrandPath(brand)}${suffix}`} replace />;
    }
  }

  const query = searchParams.toString();
  return <Navigate to={query ? `/shop?${query}` : '/shop'} replace />;
}
