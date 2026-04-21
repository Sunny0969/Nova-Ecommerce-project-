import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

/** Preserves query string when redirecting /products → /shop */
export default function LegacyShopRedirect() {
  const [searchParams] = useSearchParams();
  const q = searchParams.toString();
  return <Navigate to={q ? `/shop?${q}` : '/shop'} replace />;
}
