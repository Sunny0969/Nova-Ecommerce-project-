import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { buildCategoryPath } from '../utils/urls';

/** Maps /category/:slug → /:slug */
export default function CategoryPage() {
  const { slug } = useParams();
  return <Navigate to={buildCategoryPath(slug || '')} replace />;
}
