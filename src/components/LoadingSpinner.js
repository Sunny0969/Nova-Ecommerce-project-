import React from 'react';

/**
 * Centered loading spinner (Tailwind).
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.label] — accessible name (visually hidden)
 * @param {string} [props.className]
 */
export default function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  fullScreen = false,
  className = '',
}) {
  const sizeClass =
    size === 'sm' ? 'h-6 w-6 border-2' : size === 'lg' ? 'h-14 w-14 border-[3px]' : 'h-10 w-10 border-[3px]';

  const wrap = fullScreen
    ? 'flex min-h-[40vh] w-full flex-col items-center justify-center px-4 py-12 sm:min-h-[50vh]'
    : 'inline-flex flex-col';

  return (
    <div
      className={`${wrap} items-center justify-center gap-3 ${className}`}
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
