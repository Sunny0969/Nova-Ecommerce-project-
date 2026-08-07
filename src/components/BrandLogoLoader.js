import React from 'react';
import { businessDisplayName } from '../utils/businessContact';
import './BrandLogoLoader.css';

/**
 * Lightweight loading state — logo pulse in the main content area only.
 * @param {string} [label]
 * @param {boolean} [compact] — shorter min-height (cart rows, etc.)
 */
export default function BrandLogoLoader({ label = 'Loading', compact = false }) {
  return (
    <div
      className={`brand-logo-loader${compact ? ' brand-logo-loader--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div className="brand-logo-loader__mark" aria-hidden="true">
        <span className="brand-logo-loader__word">
          {businessDisplayName}
          <span className="brand-logo-loader__dot">.</span>
        </span>
      </div>
    </div>
  );
}
