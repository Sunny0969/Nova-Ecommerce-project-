import React, { lazy, Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { PageSuspenseFallback } from '../components/RouteFallback';
import {
  buildCategoryPath,
  buildProductPath,
  isReservedCatalogSlug,
  normalizeSlug
} from '../utils/urls';

const Shop = lazy(() => import(/* webpackChunkName: "shop" */ './Products'));
const ProductDetail = lazy(() => import(/* webpackChunkName: "product-detail" */ './ProductDetail'));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ './NotFound'));

function CatalogRouteFallback() {
  return <PageSuspenseFallback label="Loading" />;
}

/** /:categorySlug — category product listing */
export function CatalogCategoryRoute() {
  const { categorySlug } = useParams();
  if (isReservedCatalogSlug(categorySlug)) {
    return (
      <Suspense fallback={<CatalogRouteFallback />}>
        <NotFound />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<CatalogRouteFallback />}>
      <Shop />
    </Suspense>
  );
}

/** /:categorySlug/:productSlug — product detail */
export function CatalogProductRoute() {
  const { categorySlug } = useParams();
  if (isReservedCatalogSlug(categorySlug)) {
    return (
      <Suspense fallback={<CatalogRouteFallback />}>
        <NotFound />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<CatalogRouteFallback />}>
      <ProductDetail />
    </Suspense>
  );
}

/** 301-style client redirect: /shop/category/:cat/:product → /:cat/:product */
export function LegacyCatalogProductRedirect() {
  const { categorySlug, productSlug } = useParams();
  const cat = normalizeSlug(categorySlug);
  const prod = normalizeSlug(productSlug);
  if (!cat || !prod) return <Navigate to="/shop" replace />;
  return <Navigate to={buildProductPath(prod, cat)} replace />;
}

/** /shop/category/:cat → /:cat */
export function LegacyCatalogCategoryRedirect() {
  const { categorySlug } = useParams();
  const cat = normalizeSlug(categorySlug);
  if (!cat) return <Navigate to="/shop" replace />;
  return <Navigate to={buildCategoryPath(cat)} replace />;
}
