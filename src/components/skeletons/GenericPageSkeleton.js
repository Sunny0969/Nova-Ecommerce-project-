import React from 'react';
import Skeleton from 'react-loading-skeleton';

const SKEL = { baseColor: '#e8e2d8', highlightColor: '#FFF7F0' };

/** Default content skeleton for misc storefront pages. */
export default function GenericPageSkeleton({ label = 'Loading page' }) {
  return (
    <div className="page-skeleton page-skeleton--generic" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="section">
        <div className="container page-skeleton__generic-inner">
          <Skeleton height={32} width="min(100%, 320px)" {...SKEL} />
          <Skeleton height={16} width="85%" style={{ marginTop: 14 }} {...SKEL} />
          <Skeleton height={16} width="72%" style={{ marginTop: 8 }} {...SKEL} />
          <Skeleton height={200} style={{ marginTop: 28 }} borderRadius={12} {...SKEL} />
          <Skeleton count={4} height={14} style={{ marginTop: 24 }} {...SKEL} />
        </div>
      </div>
    </div>
  );
}
