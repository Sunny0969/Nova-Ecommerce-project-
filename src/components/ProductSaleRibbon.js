import React from 'react';

/**
 * Yellow diagonal sale ribbon (reference: marketplace flash sale).
 * @param {number} [discountPercent]
 * @param {string} [label] — override text (e.g. "Sale")
 * @param {'ribbon'|'pill'} [variant]
 */
export default function ProductSaleRibbon({
  discountPercent,
  label,
  variant = 'ribbon',
  className = ''
}) {
  const pct = Number(discountPercent);
  const text =
    label != null && String(label).trim()
      ? String(label).trim()
      : Number.isFinite(pct) && pct > 0
        ? `${pct}% off`
        : 'Sale';

  if (variant === 'pill') {
    return (
      <span className={`sale-badge-pill ${className}`.trim()} aria-label={text}>
        {text}
      </span>
    );
  }

  return (
    <span className={`sale-ribbon ${className}`.trim()} aria-label={text}>
      <span className="sale-ribbon__text">{text}</span>
    </span>
  );
}
