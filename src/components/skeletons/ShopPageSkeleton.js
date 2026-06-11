import React from 'react';
import Skeleton from 'react-loading-skeleton';
import ProductCard from '../ProductCard';

const SKEL = { baseColor: '#e8e2d8', highlightColor: '#FFF7F0' };

/** Shop / category listing — header + product grid placeholders. */
export default function ShopPageSkeleton() {
  return (
    <div className="page-skeleton page-skeleton--shop" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading shop</span>
      <header className="page-header">
        <div className="container">
          <Skeleton height={36} width={280} {...SKEL} />
          <Skeleton height={16} width="55%" style={{ marginTop: 12 }} {...SKEL} />
          <div className="page-skeleton__breadcrumb" style={{ marginTop: 16 }}>
            <Skeleton width={48} height={14} {...SKEL} />
            <Skeleton width={100} height={14} {...SKEL} />
          </div>
        </div>
      </header>
      <div className="section">
        <div className="container">
          <div className="shop-toolbar-skeleton">
            <Skeleton height={40} width={200} borderRadius={8} {...SKEL} />
            <Skeleton height={40} width={120} borderRadius={8} {...SKEL} />
          </div>
          <div className="products-grid" style={{ marginTop: '1.5rem' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <ProductCard key={i} loading />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
