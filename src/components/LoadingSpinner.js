import React from 'react';
import BrandLogoLoader from './BrandLogoLoader';

/**
 * Inline spinner for admin/small areas. Storefront full-page waits use BrandLogoLoader.
 */
export default function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  fullScreen = false,
  className = '',
}) {
  if (fullScreen) {
    return <BrandLogoLoader label={label} />;
  }

  const sizeClass =
    size === 'sm' ? 'h-6 w-6 border-2' : size === 'lg' ? 'h-14 w-14 border-[3px]' : 'h-10 w-10 border-[3px]';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={`inline-block rounded-full border-neutral-200 border-t-neutral-900 animate-spin ${sizeClass}`}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
