function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Full order value for analytics (Meta / GA4).
 * Prefers totalPrice + walletAmountUsed; falls back to line items + fees.
 */
export function resolveOrderPurchaseValue(order) {
  if (!order) return 0;

  const wallet = Number(order.walletAmountUsed) || 0;
  const total = Number(order.totalPrice);

  if (Number.isFinite(total) && total >= 0) {
    const fromTotals = total + wallet;
    if (fromTotals > 0) return round2(fromTotals);
  }

  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const itemsSum = items.reduce(
    (sum, line) => sum + (Number(line.price) || 0) * (Number(line.quantity) || 1),
    0
  );

  const shipping = Number(order.shippingPrice) || 0;
  const tax = Number(order.taxPrice) || 0;
  const discount = Number(order.discountAmount) || 0;

  return round2(itemsSum + shipping + tax - discount + wallet);
}
