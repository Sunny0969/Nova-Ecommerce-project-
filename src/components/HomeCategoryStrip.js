import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronsRight } from 'lucide-react';
import api from '../api/client';
import { sortCategoriesAlphabetically, unwrapCategoriesResponse } from '../lib/api';
import { buildCategoryPath } from '../utils/urls';
import './HomeCategoryStrip.css';

const COMING_SOON = 'Coming Soon';

export default function HomeCategoryStrip() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/categories');
        if (!cancelled) setCategories(unwrapCategoriesResponse(res));
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollCategories = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.min(280, el.clientWidth * 0.85), behavior: 'smooth' });
  }, []);

  const sortedCategories = useMemo(
    () => sortCategoriesAlphabetically(categories),
    [categories]
  );

  return (
    <nav className="home-category-strip" aria-label="Browse categories">
      <div className="home-category-strip__inner">
        <div ref={scrollRef} className="home-category-strip__scroll">
          {loading ? (
            <span className="home-category-strip__status home-category-strip__status--skeleton" aria-hidden>
              {'\u00A0'}
            </span>
          ) : categories.length === 0 ? (
            <span className="home-category-strip__status">{COMING_SOON}</span>
          ) : (
            sortedCategories.map((cat) => {
              const slug = cat.slug || '';
              const name = cat.name || slug;
              return (
                <Link
                  key={cat._id || slug}
                  to={buildCategoryPath(slug)}
                  className="home-category-strip__link"
                >
                  {name}
                </Link>
              );
            })
          )}
        </div>

        {sortedCategories.length > 0 && (
          <button
            type="button"
            className="home-category-strip__more"
            onClick={scrollCategories}
            aria-label="Scroll categories right"
          >
            <ChevronsRight size={20} strokeWidth={2.5} aria-hidden />
          </button>
        )}
      </div>
    </nav>
  );
}
