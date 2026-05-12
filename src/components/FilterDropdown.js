import React from 'react';

/**
 * FilterDropdown
 * - Native <select> for keyboard accessibility.
 */
export default function FilterDropdown({ id, label, value, onChange, options }) {
  return (
    <div className="blog-filter">
      <label className="blog-filter__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="blog-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

