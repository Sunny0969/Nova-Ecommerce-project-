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
    let retryTimer = null;

    const loadCats = async (attempt = 1) => {
      try {
        const res = await api.get('/api/categories');
        if (!cancelled) {
          const list = unwrapCategoriesResponse(res);
          setCategories(list);
          if (list.length === 0 && attempt < 3) {
            retryTimer = setTimeout(() => loadCats(attempt + 1), 3000);
          }
        }
      } catch {
        if (!cancelled) {
          if (attempt < 3) {
            retryTimer = setTimeout(() => loadCats(attempt + 1), 3000);
          } else {
            setCategories([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCats(1);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
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
