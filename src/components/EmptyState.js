import React from 'react';
import { PackageOpen } from 'lucide-react';

/**
 * @param {object} props
 * @param {React.ReactNode} [props.illustration] — image or icon; defaults to Lucide icon
 * @param {string} props.title
 * @param {React.ReactNode} [props.message]
 * @param {string} [props.actionLabel]
 * @param {() => void} [props.onAction]
 * @param {string} [props.className]
 */
export default function EmptyState({
  illustration,
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 text-center sm:max-w-lg sm:px-6 sm:py-14 ${className}`}
    >
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 sm:mb-6 sm:h-28 sm:w-28">
        {illustration != null ? (
          illustration
        ) : (
          <PackageOpen className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.25} aria-hidden />
        )}
      </div>
      <h2 className="text-lg font-semibold text-neutral-900 sm:text-xl">{title}</h2>
      {message != null && message !== '' && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-600 sm:mt-3 sm:text-base">
          {message}
        </p>
      )}
      {actionLabel && typeof onAction === 'function' && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex min-h-[44px] w-full max-w-xs items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:mt-8 sm:w-auto sm:min-w-[12rem]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
