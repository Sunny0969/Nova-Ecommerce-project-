import React from 'react';
import Skeleton from 'react-loading-skeleton';

const SKEL = { baseColor: '#e8e2d8', highlightColor: '#FFF7F0' };

/** Home route chunk — hero + categories grid shimmer. */
export default function HomePageSkeleton() {
  return (
    <div className="page-skeleton page-skeleton--home" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading home</span>
      <div className="home-top-stack">
        <Skeleton height={220} borderRadius={0} {...SKEL} />
        <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
          <Skeleton height={28} width="70%" {...SKEL} />
          <Skeleton height={16} width="45%" style={{ marginTop: 10 }} {...SKEL} />
        </div>
      </div>
      <section className="section home-categories-browse">
        <div className="container">
          <Skeleton height={28} width={160} style={{ marginBottom: '1.25rem' }} {...SKEL} />
          <div className="page-skeleton__category-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="page-skeleton__category-tile">
                <Skeleton height={120} borderRadius={12} {...SKEL} />
                <Skeleton height={14} width="80%" style={{ marginTop: 10 }} {...SKEL} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="home-section-placeholder" aria-hidden>
        <span className="home-section-placeholder__bar" />
        <span className="home-section-placeholder__bar home-section-placeholder__bar--short" />
      </div>
    </div>
  );
}
