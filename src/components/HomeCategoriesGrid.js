import React from 'react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';
import { buildCategoryImageAlt } from '../utils/imageAlt';
import { buildCategoryPath } from '../utils/urls';
import OptimizedImage from './OptimizedImage';
import './HomeCategoriesGrid.css';

const SKELETON_COUNT = 32;
const CATEGORY_TILE_SIZE = 600;

export default function HomeCategoriesGrid({ categories, loading, error, onRetry }) {
  if (loading) {
    return (
      <div
        className="home-categories-browse__grid home-categories-browse__grid--loading"
        aria-busy="true"
        aria-label="Loading categories"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="home-category-tile home-category-tile--skeleton" aria-hidden="true">
            <span className="home-category-tile__media-skel" />
            <span className="home-category-tile__name-skel" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-categories-browse__error" role="alert">
        <p>{error}</p>
        {onRetry ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (!categories.length) {
    return <p className="home-categories-browse__empty">Coming Soon</p>;
  }

  return (
    <div className="home-categories-browse__grid">
      {categories.map((cat) => {
        const slug = cat.slug || '';
        const name = cat.name || slug;
        const imageUrl = optimizeImageUrl(cat.image?.url, {
          width: 600,
          quality: 60
        });

        return (
          <Link
            key={cat._id || slug}
            to={buildCategoryPath(slug)}
            className="home-category-tile"
          >
            <span className="home-category-tile__media">
              {imageUrl ? (
                <OptimizedImage
                  src={imageUrl}
                  alt={buildCategoryImageAlt(name, slug)}
                  className="home-category-tile__img"
                  width={CATEGORY_TILE_SIZE}
                  height={CATEGORY_TILE_SIZE}
                  optimizeWidth={CATEGORY_TILE_SIZE}
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
      })}
    </div>
  );
}
