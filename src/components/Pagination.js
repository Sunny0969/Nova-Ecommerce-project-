import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** @param {number} current @param {number} total @param {number} siblings */
function buildPages(current, total, siblings = 1) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const left = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;

  /** @type {(number | string)[]} */
  const items = [1];
  if (showLeftEllipsis) items.push('…');
  for (let i = left; i <= right; i += 1) {
    items.push(i);
  }
  if (showRightEllipsis) items.push('…');
  if (total > 1) items.push(total);

  const seen = new Set();
  const out = [];
  for (const p of items) {
    if (p === '…') {
      out.push(p);
      continue;
    }
    if (typeof p === 'number' && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

/**
 * @param {object} props
 * @param {number} props.currentPage — 1-based
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onPageChange
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  ariaLabel = 'Pagination',
}) {
  const safeTotal = Math.max(1, Math.floor(totalPages) || 1);
  const safeCurrent = Math.min(Math.max(1, Math.floor(currentPage) || 1), safeTotal);

  const pages = useMemo(() => buildPages(safeCurrent, safeTotal, 1), [safeTotal, safeCurrent]);

  const go = (p) => {
    if (p < 1 || p > safeTotal || p === safeCurrent) return;
    onPageChange?.(p);
  };

  if (safeTotal <= 1) return null;

  const btnBase =
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[40px] sm:min-w-[40px]';

  return (
    <nav className={`w-full ${className}`} aria-label={ariaLabel}>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-xs text-neutral-500 sm:text-left sm:text-sm">
          Page <span className="font-semibold text-neutral-800">{safeCurrent}</span> of{' '}
          <span className="font-semibold text-neutral-800">{safeTotal}</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end sm:gap-1">
          <button
            type="button"
            className={`${btnBase} px-2 sm:px-3`}
            onClick={() => go(safeCurrent - 1)}
            disabled={safeCurrent <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {pages.map((p, idx) => {
              if (p === '…') {
                return (
                  <span
                    key={`e-${idx}`}
                    className="inline-flex min-w-[2.25rem] items-center justify-center px-1 text-neutral-400"
                    aria-hidden
                  >
                    …
                  </span>
                );
              }
              const active = p === safeCurrent;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => go(p)}
                  aria-label={`Page ${p}`}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:min-h-[40px] sm:min-w-[40px] ${
                    active
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`${btnBase} px-2 sm:px-3`}
            onClick={() => go(safeCurrent + 1)}
            disabled={safeCurrent >= safeTotal}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </nav>
  );
}
