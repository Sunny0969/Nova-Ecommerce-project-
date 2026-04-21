import React from 'react';

/**
 * Product card skeleton (Tailwind pulse). Matches typical card layout.
 * @param {object} [props]
 * @param {string} [props.className]
 */
export default function SkeletonCard({ className = '' }) {
  return (
    <article
      className={`overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm ${className}`}
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-neutral-200 sm:aspect-[4/3]" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-4 max-w-[12rem] w-[80%] animate-pulse rounded bg-neutral-200" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="h-6 w-28 animate-pulse rounded bg-neutral-200" />
        <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-300" />
      </div>
    </article>
  );
}
