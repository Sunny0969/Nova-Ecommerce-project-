import React from 'react';
import Skeleton from 'react-loading-skeleton';

const SKEL = { baseColor: '#e8e2d8', highlightColor: '#FFF7F0' };

/** Matches product detail layout — shown while route chunk or API loads. */
export default function ProductDetailPageSkeleton() {
  return (
    <div className="page-skeleton page-skeleton--product" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading product</span>
      <header className="page-header page-header--product-detail">
        <div className="container">
          <div className="page-skeleton__breadcrumb">
            <Skeleton width={48} height={14} {...SKEL} />
            <Skeleton width={120} height={14} {...SKEL} />
            <Skeleton width={160} height={14} {...SKEL} />
          </div>
        </div>
      </header>
      <div className="section product-detail-page">
        <div className="container product-detail-grid">
          <div className="product-detail-gallery-col">
            <Skeleton height={420} borderRadius={12} {...SKEL} />
            <div className="page-skeleton__thumbs">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={72} height={72} borderRadius={8} {...SKEL} />
              ))}
            </div>
          </div>
          <div className="product-detail-info">
            <Skeleton width={100} height={12} {...SKEL} />
            <Skeleton height={32} width="92%" style={{ marginTop: 12 }} {...SKEL} />
            <Skeleton height={32} width="70%" style={{ marginTop: 8 }} {...SKEL} />
            <div className="page-skeleton__rating" style={{ marginTop: 16 }}>
              <Skeleton width={120} height={18} {...SKEL} />
              <Skeleton width={36} height={14} {...SKEL} />
            </div>
            <Skeleton width={80} height={22} style={{ marginTop: 16 }} borderRadius={999} {...SKEL} />
            <Skeleton height={36} width={140} style={{ marginTop: 20 }} {...SKEL} />
            <Skeleton count={3} height={14} style={{ marginTop: 20 }} {...SKEL} />
            <Skeleton height={48} width={160} style={{ marginTop: 24 }} borderRadius={8} {...SKEL} />
            <Skeleton height={48} style={{ marginTop: 12 }} borderRadius={8} {...SKEL} />
          </div>
        </div>
      </div>
    </div>
  );
}
