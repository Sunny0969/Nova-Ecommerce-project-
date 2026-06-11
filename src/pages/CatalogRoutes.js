import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Shop from './Products';
import ProductDetail from './ProductDetail';
import NotFound from './NotFound';
import {
  buildCategoryPath,
  buildProductPath,
  isReservedCatalogSlug,
  normalizeSlug
} from '../utils/urls';

/** /:categorySlug — category product listing */
export function CatalogCategoryRoute() {
  const { categorySlug } = useParams();
  if (isReservedCatalogSlug(categorySlug)) {
    return <NotFound />;
  }
  return <Shop />;
}

/** /:categorySlug/:productSlug — product detail */
export function CatalogProductRoute() {
  const { categorySlug } = useParams();
  if (isReservedCatalogSlug(categorySlug)) {
    return <NotFound />;
  }
  return <ProductDetail />;
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
