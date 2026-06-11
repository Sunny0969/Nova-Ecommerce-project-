import React from 'react';

/** Reserved height while below-fold home chunks load — limits CLS. */
export default function HomeSectionFallback({ label = 'Loading section' }) {
  return (
    <div className="home-section-placeholder" role="status" aria-label={label}>
      <span className="home-section-placeholder__bar" aria-hidden />
      <span className="home-section-placeholder__bar home-section-placeholder__bar--short" aria-hidden />
    </div>
  );
}
