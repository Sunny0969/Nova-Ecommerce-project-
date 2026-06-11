import React from 'react';
import { Link } from 'react-router-dom';

/**
 * QuickLinksGrid — keyword-rich internal links to shop categories.
 */
export default function QuickLinksGrid({ links }) {
  return (
    <section className="section section--blog quick-links" aria-label="Quick links">
      <div className="container">
        <div className="section-header">
          <span className="section-tag section-tag--light">Shop by topic</span>
          <h2 className="section-header__title">Curated category picks</h2>
          <p className="section-header__sub">Jump to categories based on what you want to improve today.</p>
        </div>

        <div className="quick-links__grid" role="list">
          {links.map((l) => (
            <Link
              key={l.id}
              role="listitem"
              to={l.url}
              className="quick-link"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
