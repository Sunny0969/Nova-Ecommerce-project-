import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/** Maps /category/:slug → shop listing filtered by category */
export default function CategoryPage() {
  const { slug } = useParams();
  return <Navigate to={`/shop?category=${encodeURIComponent(slug || '')}`} replace />;
}
