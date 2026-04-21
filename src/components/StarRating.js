import React, { useId } from 'react';
import { Star } from 'lucide-react';

/**
 * @param {object} props
 * @param {'display'|'interactive'} [props.mode='display']
 * @param {number} [props.value=0] — 0–5 (display rounds for stars; interactive uses integer steps)
 * @param {(n: number) => void} [props.onChange] — interactive only
 * @param {number} [props.max=5]
 * @param {string} [props.name] — form name (interactive); defaults to unique id
 * @param {string} [props.className]
 * @param {boolean} [props.showValue=false] — show numeric value next to stars (display)
 * @param {boolean} [props.disabled=false]
 */
export default function StarRating({
  mode = 'display',
  value = 0,
  onChange,
  max = 5,
  name,
  className = '',
  showValue = false,
  disabled = false,
}) {
  const uid = useId();
  const fieldName = name || `star-rating-${uid}`;
  const safeMax = Math.max(1, Math.min(10, max));
  const v = Number(value);
  const clamped = Number.isFinite(v) ? Math.min(safeMax, Math.max(0, v)) : 0;
  const rounded = Math.round(clamped * 2) / 2; // display supports halves
  const filled = Math.round(clamped);

  if (mode === 'interactive') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-1 sm:gap-1.5 ${className}`}
        role="group"
        aria-label="Rating"
      >
        {Array.from({ length: safeMax }, (_, i) => {
          const starValue = i + 1;
          const active = starValue <= filled;
          return (
            <button
              key={starValue}
              type="button"
              name={fieldName}
              disabled={disabled}
              aria-pressed={active}
              aria-label={`${starValue} out of ${safeMax} stars`}
              className="rounded p-0.5 text-amber-400 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onChange?.(starValue)}
            >
              <Star
                className={`h-6 w-6 sm:h-7 sm:w-7 ${active ? 'fill-current' : 'fill-none text-neutral-300'}`}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    );
  }

  const full = Math.floor(rounded);
  const hasHalf = rounded - full >= 0.5;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}
      role="img"
      aria-label={`${clamped.toFixed(1)} out of ${safeMax} stars`}
    >
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: safeMax }, (_, i) => {
          const starValue = i + 1;
          const activeFull = starValue <= full;
          const activeHalf = !activeFull && hasHalf && starValue === full + 1;

          if (activeHalf) {
            return (
              <span key={starValue} className="relative inline-block h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]">
                <Star
                  className="absolute inset-0 h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem] fill-none text-neutral-300"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <Star
                  className="absolute inset-0 h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem] fill-amber-400 text-amber-400"
                  strokeWidth={1.5}
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                  aria-hidden
                />
              </span>
            );
          }

          return (
            <Star
              key={starValue}
              className={`h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem] ${
                activeFull ? 'fill-amber-400 text-amber-400' : 'fill-none text-neutral-300'
              }`}
              strokeWidth={1.5}
              aria-hidden
            />
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-medium tabular-nums text-neutral-600 sm:text-sm">
          {clamped.toFixed(1)}
        </span>
      )}
    </div>
  );
}
