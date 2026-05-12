import React from 'react';
import { Camera, Compass, Search } from 'lucide-react';

/**
 * BlogHero
 * - Hero uses theme colors and left illustration.
 */
export default function BlogHero({ searchValue, onSearchChange, onSubmit }) {
  return (
    <section className="section section--blog section--blog-hero" aria-label="Blog hero">
      <div className="container blog-hero">
        <div className="blog-hero__left">
          <div className="blog-hero__art" aria-hidden="true">
            <div className="blog-hero__art-ring" />
            <div className="blog-hero__art-icon blog-hero__art-icon--camera">
              <Camera size={30} strokeWidth={1.75} />
            </div>
            <div className="blog-hero__art-icon blog-hero__art-icon--compass">
              <Compass size={30} strokeWidth={1.75} />
            </div>
            <div className="blog-hero__art-sub">Nova Journal</div>
          </div>
        </div>

        <div className="blog-hero__right">
          <h1 className="blog-hero__title">SHOP THE STORY</h1>
          <p className="blog-hero__subtitle">
            Explore care guides, tech tips, and style notes — then jump straight to curated picks.
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
                placeholder="Search topics, guides, and collections..."
              />
              <button type="submit" className="blog-hero__search-btn" aria-label="Search">
                Search
              </button>
            </div>
          </form>

          <div className="blog-hero__idea-grid" aria-label="Top blog ideas">
            <div className="blog-hero__idea">Care that lasts</div>
            <div className="blog-hero__idea">Tech, simplified</div>
            <div className="blog-hero__idea">Home refresh</div>
            <div className="blog-hero__idea">Everyday style</div>
          </div>
        </div>
      </div>
    </section>
  );
}

