import React from 'react';
import { ChevronDown } from 'lucide-react';
import './ShopClothingFilters.css';

const GENDER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' }
];

export default function ShopClothingFilters({
  tree,
  loading = false,
  selectedGender = '',
  selectedSubcategory = '',
  onGenderChange,
  onSubcategoryChange,
  className = ''
}) {
  const genders = Array.isArray(tree?.genders) ? tree.genders : [];
  const activeGenderRow = genders.find((g) => g.gender === selectedGender) || null;
  const subcategories = activeGenderRow?.subcategories || [];

  return (
    <div
      className={`shop-clothing-filters${className ? ` ${className}` : ''}`}
      role="toolbar"
      aria-label="Clothing filters"
    >
      <div className="shop-clothing-filters__group">
        <label className="shop-clothing-filters__label" htmlFor="shop-clothing-gender">
          Shop for
        </label>
        <div className="shop-clothing-filters__select-wrap">
          <select
            id="shop-clothing-gender"
            className="shop-clothing-filters__select"
            value={selectedGender}
            disabled={loading}
            onChange={(e) => onGenderChange(e.target.value)}
            aria-label="Gender"
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="shop-clothing-filters__chevron" aria-hidden />
        </div>
      </div>

      <div className="shop-clothing-filters__group">
        <label className="shop-clothing-filters__label" htmlFor="shop-clothing-subcategory">
          Type
        </label>
        <div className="shop-clothing-filters__select-wrap">
          <select
            id="shop-clothing-subcategory"
            className="shop-clothing-filters__select"
            value={selectedSubcategory}
            disabled={loading || !selectedGender}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            aria-label="Subcategory"
          >
            <option value="">All types</option>
            {subcategories.map((sub) => (
              <option key={sub.slug} value={sub.slug}>
                {sub.name}
                {sub.productCount > 0 ? ` (${sub.productCount})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="shop-clothing-filters__chevron" aria-hidden />
        </div>
      </div>
    </div>
  );
}
