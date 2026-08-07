import React from 'react';
import './ShopCategorySubfilters.css';

export default function ShopCategorySubfilters({
  subcategories = [],
  loading = false,
  selectedSubcategory = '',
  onSubcategoryChange,
  className = '',
  ariaLabel = 'Category filters'
}) {
  const rows = Array.isArray(subcategories) ? subcategories : [];

  if (!loading && rows.length === 0) return null;

  return (
    <div
      className={`shop-category-subfilters${className ? ` ${className}` : ''}`}
      role="toolbar"
      aria-label={ariaLabel}
    >
      <div className="shop-category-subfilters__chips">
        <button
          type="button"
          className={`shop-category-subfilters__chip${
            !selectedSubcategory ? ' shop-category-subfilters__chip--active' : ''
          }`}
          aria-pressed={!selectedSubcategory}
          disabled={loading}
          onClick={() => onSubcategoryChange('')}
        >
          All
        </button>
        {rows.map((sub) => (
          <button
            key={sub.slug || sub._id}
            type="button"
            className={`shop-category-subfilters__chip${
              selectedSubcategory === sub.slug ? ' shop-category-subfilters__chip--active' : ''
            }`}
            aria-pressed={selectedSubcategory === sub.slug}
            disabled={loading}
            onClick={() => onSubcategoryChange(sub.slug)}
          >
            {sub.name}
            {sub.productCount > 0 ? ` (${sub.productCount})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
