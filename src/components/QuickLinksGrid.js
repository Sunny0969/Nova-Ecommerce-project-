import React from 'react';

/**
 * QuickLinksGrid
 * - 4x6 grid (24 buttons) themed to the blog/journal.
 */
export default function QuickLinksGrid({ links }) {
  return (
    <section className="section section--blog quick-links" aria-label="Quick links">
      <div className="container">
        <div className="section-header">
          <span className="section-tag section-tag--light">Explore destinations</span>
          <h2 className="section-header__title">Shop by Journal</h2>
          <p className="section-header__sub">Jump to curated categories based on what you want to improve today.</p>
        </div>

        <div className="quick-links__grid" role="list">
          {links.map((l) => (
            <a
              key={l.id}
              role="listitem"
              href={l.url}
              className="quick-link"
              aria-label={`Go to ${l.label}`}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

