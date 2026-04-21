import React from 'react';

const VARIANTS = {
  sale: 'bg-red-600 text-white ring-1 ring-inset ring-red-700/30',
  new: 'bg-amber-400 text-neutral-900 ring-1 ring-inset ring-amber-500/40',
  bestseller:
    'bg-gradient-to-br from-slate-800 to-slate-950 text-amber-200 ring-1 ring-inset ring-amber-200/30',
};

/**
 * Product badge — Sale / New / Bestseller.
 * @param {object} props
 * @param {'sale'|'new'|'bestseller'} props.variant
 * @param {React.ReactNode} [props.children] — override label
 * @param {string} [props.className]
 */
export default function Badge({ variant = 'sale', children, className = '' }) {
  const styles = VARIANTS[variant] || VARIANTS.sale;
  const label =
    children != null
      ? children
      : variant === 'sale'
        ? 'Sale'
        : variant === 'new'
          ? 'New'
          : 'Bestseller';

  return (
    <span
      className={`inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider shadow-sm sm:px-3 sm:text-xs ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
