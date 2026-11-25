import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { buildCategoryImageAlt } from '../utils/imageAlt';
import { buildCategoryPath } from '../utils/urls';
import { sortCategoriesAlphabetically } from '../lib/api';
import './HomeCategoriesGrid.css';

const DEFAULT_CATEGORIES = [
  { name: 'Men', slug: 'men', icon: '👔', image: { url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=300&q=80' } },
  { name: 'Women', slug: 'women', icon: '👗', image: { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80' } },
  { name: 'Kids', slug: 'kids', icon: '🧒', image: { url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&q=80' } },
  { name: 'Footwear', slug: 'footwear', icon: '👟', image: { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80' } },
  { name: 'Accessories', slug: 'accessories', icon: '🕶️', image: { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&q=80' } },
  { name: 'Bags', slug: 'bags', icon: '👜', image: { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&q=80' } },
];

function CategoryTile({ cat }) {
  const slug = cat.slug || '';
  const name = cat.name || slug;
  const imageUrl = typeof cat.image === 'string'
    ? cat.image
    : (cat.image?.url || cat.image?.secure_url || '');

  return (
    <Link to={buildCategoryPath(slug)} className="fashion-cat-card">
      <div className="fashion-cat-card__media">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={buildCategoryImageAlt(name, slug)}
            className="fashion-cat-card__img"
            width={120}
            height={120}
            loading="lazy"
          />
        ) : (
          <span className="fashion-cat-card__emoji" aria-hidden="true">
            {cat.icon || '🛍️'}
          </span>
        )}
      </div>
      <span className="fashion-cat-card__name">{name}</span>
    </Link>
  );
}

export default function HomeCategoriesGrid({ categories = [], loading, error, onRetry }) {
  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return sortCategoriesAlphabetically(categories).slice(0, 6);
    }
    return DEFAULT_CATEGORIES;
  }, [categories]);

  return (
    <div className="fashion-cat-section">
      <div className="fashion-cat-header">
        <h2 className="fashion-cat-title">Shop by Category</h2>
        <Link to="/shop" className="fashion-cat-view-all">
          <span>View All</span>
          <ArrowRight size={15} strokeWidth={2.2} />
        </Link>
      </div>

      {loading ? (
        <div className="fashion-cat-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="fashion-cat-card fashion-cat-card--skeleton">
              <div className="fashion-cat-card__media-skel" />
              <div className="fashion-cat-card__name-skel" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="fashion-cat-error">
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="fashion-cat-grid">
          {displayCategories.map((cat) => (
            <CategoryTile key={cat._id || cat.slug || cat.name} cat={cat} />
          ))}
        </div>
      )}
    </div>
  );
}
