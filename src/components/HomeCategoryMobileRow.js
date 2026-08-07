import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';
import { buildCategoryImageAlt } from '../utils/imageAlt';
import { buildCategoryPath } from '../utils/urls';
import { sortCategoriesAlphabetically } from '../lib/api';
import OptimizedImage from './OptimizedImage';
import './HomeCategoryStrip.css';

const COMING_SOON = 'Coming Soon';
const MOBILE_TILE_IMAGE = 120;
const MOBILE_SKELETON_COUNT = 7;

export default function HomeCategoryMobileRow({ categories = [], loading = false }) {
  const sortedCategories = useMemo(
    () => sortCategoriesAlphabetically(categories),
    [categories]
  );

  return (
    <nav className="home-category-mobile-row" aria-label="Browse categories">
      <div className="home-category-mobile-row__scroll">
        {loading ? (
          Array.from({ length: MOBILE_SKELETON_COUNT }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="home-category-strip__tile home-category-strip__tile--skeleton"
              aria-hidden="true"
            >
              <span className="home-category-strip__tile-icon-skel" />
              <span className="home-category-strip__tile-label-skel" />
            </div>
          ))
        ) : sortedCategories.length === 0 ? (
          <span className="home-category-strip__status">{COMING_SOON}</span>
        ) : (
          sortedCategories.map((cat) => {
            const slug = cat.slug || '';
            const name = cat.name || slug;
            const imageUrl = optimizeImageUrl(cat.image?.url, {
              width: MOBILE_TILE_IMAGE,
              quality: 60
            });

            return (
              <Link
                key={cat._id || slug}
                to={buildCategoryPath(slug)}
                className="home-category-strip__tile"
              >
                <span className="home-category-strip__tile-icon">
                  {imageUrl ? (
                    <OptimizedImage
                      src={imageUrl}
                      alt={buildCategoryImageAlt(name, slug)}
                      className="home-category-strip__tile-img"
                      width={MOBILE_TILE_IMAGE}
                      height={MOBILE_TILE_IMAGE}
                      optimizeWidth={MOBILE_TILE_IMAGE}
                    />
                  ) : (
                    <span className="home-category-strip__tile-placeholder" aria-hidden="true">
                      🛍️
                    </span>
                  )}
                </span>
                <span className="home-category-strip__tile-label">{name}</span>
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
}
