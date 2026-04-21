import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export default function LegacyProductRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/shop/${encodeURIComponent(slug || '')}`} replace />;
}
