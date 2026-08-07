import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { buildCategoryImageAlt } from '../utils/imageAlt';
import { buildCategoryPath } from '../utils/urls';
import { sortCategoriesAlphabetically } from '../lib/api';
import './HomeCategoriesGrid.css';

const CATEGORY_TILE_SIZE = 600;

function useColsPerRow() {
  const [cols, setCols] = useState(8);

  useEffect(() => {
    const mqMd = window.matchMedia('(max-width: 1023px)');

    const update = () => {
      setCols(mqMd.matches ? 5 : 8);
    };

    update();
    mqMd.addEventListener('change', update);
    return () => mqMd.removeEventListener('change', update);
  }, []);

  return cols;
}

function chunkArray(list, size) {
  if (!size || size < 1) return [list];
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}

function CategoryTile({ cat }) {
  const slug = cat.slug || '';
  const name = cat.name || slug;
  const imageUrl = cat.image?.url || '';

  return (
    <Link to={buildCategoryPath(slug)} className="home-category-tile">
      <span className="home-category-tile__media">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={buildCategoryImageAlt(name, slug)}
            className="home-category-tile__img"
            width={CATEGORY_TILE_SIZE}
            height={CATEGORY_TILE_SIZE}
            optimizeWidth={CATEGORY_TILE_SIZE}
            loading="lazy"
          />
        ) : (
          <span className="home-category-tile__placeholder" aria-hidden="true">
            🛍️
          </span>
        )}
      </span>
      <span className="home-category-tile__name">{name}</span>
    </Link>
  );
}

export default function HomeCategoriesGrid({ categories, loading, error, onRetry }) {
  const cols = useColsPerRow();
  const [page, setPage] = useState(0);

  const sortedCategories = useMemo(
    () => sortCategoriesAlphabetically(categories),
    [categories]
  );

  const useSlider = sortedCategories.length > cols;
  const pages = useMemo(
    () => (useSlider ? chunkArray(sortedCategories, cols) : [sortedCategories]),
    [sortedCategories, cols, useSlider]
  );

  const totalPages = pages.length;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    setPage(0);
  }, [sortedCategories.length, cols]);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const gridStyle = { '--home-cat-cols': String(cols) };

  return (
    <>
      <div className="home-categories-browse__header">
        <h2 className="home-categories-browse__title">Categories</h2>
        {useSlider && !loading && !error && sortedCategories.length > 0 ? (
          <div className="home-categories-browse__nav" aria-label="Browse category pages">
            <button
              type="button"
              className="home-categories-browse__arrow"
              onClick={goPrev}
              disabled={safePage <= 0}
              aria-label="Previous categories"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="home-categories-browse__arrow"
              onClick={goNext}
              disabled={safePage >= totalPages - 1}
              aria-label="Next categories"
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div
          className="home-categories-browse__grid home-categories-browse__grid--loading"
          style={gridStyle}
          aria-busy="true"
          aria-label="Loading categories"
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="home-category-tile home-category-tile--skeleton" aria-hidden="true">
              <span className="home-category-tile__media-skel" />
              <span className="home-category-tile__name-skel" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="home-categories-browse__error" role="alert">
          <p>{error}</p>
          {onRetry ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      ) : !sortedCategories.length ? (
        <p className="home-categories-browse__empty">Coming Soon</p>
      ) : (
        <div
          className={`home-categories-browse__body${useSlider ? ' home-categories-browse__body--slider' : ''}`}
        >
          <div className="home-categories-browse__viewport">
            {useSlider ? (
              <div
                className="home-categories-browse__track"
                style={{ transform: `translateX(-${safePage * 100}%)` }}
              >
                {pages.map((chunk, pageIndex) => (
                  <div
                    key={`cat-page-${pageIndex}`}
                    className="home-categories-browse__grid home-categories-browse__page"
                    style={gridStyle}
                  >
                    {chunk.map((cat) => (
                      <CategoryTile key={cat._id || cat.slug} cat={cat} />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="home-categories-browse__grid" style={gridStyle}>
                {sortedCategories.map((cat) => (
                  <CategoryTile key={cat._id || cat.slug} cat={cat} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {useSlider && !loading && !error && totalPages > 1 ? (
        <div className="home-categories-browse__dots" role="tablist" aria-label="Category pages">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safePage}
              className={`home-categories-browse__dot${i === safePage ? ' home-categories-browse__dot--active' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1} of ${totalPages}`}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
