import React from 'react';
import { Search } from 'lucide-react';

const TOPIC_CHIPS = [
  'Care that lasts',
  'Tech, simplified',
  'Home refresh',
  'Everyday style'
];

/**
 * Blog listing hero — text-first, no illustration (Bazaar cream / navy / orange).
 */
export default function BlogHero({ searchValue, onSearchChange, onSubmit }) {
  return (
    <section className="section section--blog-hero" aria-label="Blog hero">
      <div className="container blog-hero">
        <p className="blog-hero__eyebrow">Bazaar editorial</p>
        <h1 className="blog-hero__title">Shopping Guides &amp; Tips</h1>
        <p className="blog-hero__subtitle">
          Expert grocery, home, and lifestyle guides for Pakistan — read practical tips and shop
          curated picks with fast delivery.
        </p>

        <form className="blog-hero__search" onSubmit={onSubmit} role="search" aria-label="Search blog">
          <label className="visually-hidden" htmlFor="blog-search">
            Search blog
          </label>
          <div className="blog-hero__search-row">
            <span className="blog-hero__search-icon" aria-hidden="true">
              <Search size={18} strokeWidth={2} />
            </span>
            <input
              id="blog-search"
              className="blog-hero__search-input"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search topics, guides, and collections…"
            />
            <button type="submit" className="blog-hero__search-btn">
              Search
            </button>
          </div>
        </form>

        <div className="blog-hero__chips" aria-label="Popular topics">
          {TOPIC_CHIPS.map((label) => (
            <span key={label} className="blog-hero__chip">
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
