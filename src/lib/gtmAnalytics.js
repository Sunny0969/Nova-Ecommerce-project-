/**
 * GA4 (gtag.js) ecommerce + SPA page views.
 * Measurement ID: G-S6GWN1X1JT (loaded from public/index.html).
 *
 * Do NOT also add a GA4 Configuration tag in GTM for the same ID — that double-counts.
 * GTM (GTM-MMBMKP9R) can still be used for other tags (Ads, etc.).
 */

export const GA4_MEASUREMENT_ID = 'G-S6GWN1X1JT';

const CURRENCY = 'PKR';

function hasGtag() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

function sendEvent(eventName, params) {
  if (!hasGtag()) return;
  window.gtag('event', eventName, params);
}

function productId(product) {
  return String(product?._id || product?.id || product?.productId || '').trim();
}

function unitPrice(product) {
  return Number(product?.price) || 0;
}

function mapProductItem(product, quantity = 1) {
  const id = productId(product);
  if (!id) return null;
  return {
    item_id: id,
    item_name: product?.name || 'Product',
    price: unitPrice(product),
    quantity: Math.max(1, Number(quantity) || 1)
  };
}

function cartToItems(cart) {
  if (!Array.isArray(cart)) return [];
  return cart
    .map((line) => {
      const product = line?.product && typeof line.product === 'object' ? line.product : line;
      const id = productId(product) || String(line?.product || '').trim();
      if (!id) return null;
      return {
        item_id: id,
        item_name: line?.name || product?.name || 'Product',
        price: Number(line?.price ?? product?.price) || 0,
        quantity: Math.max(1, Number(line?.quantity) || 1)
      };
    })
    .filter(Boolean);
}

function orderToItems(order) {
  return (order?.orderItems || [])
    .map((line) => {
      const ref = line?.product;
      const id =
        ref && typeof ref === 'object'
          ? String(ref._id || '').trim()
          : String(ref || '').trim();
      if (!id) return null;
      return {
        item_id: id,
        item_name: line?.name || 'Product',
        price: Number(line?.price) || 0,
        quantity: Math.max(1, Number(line?.quantity) || 1)
      };
    })
    .filter(Boolean);
}

function purchaseValue(order) {
  const total = Number(order?.totalPrice) || 0;
  const wallet = Number(order?.walletAmountUsed) || 0;
  return Math.round((total + wallet) * 100) / 100;
}

function shouldSkipPurchase(orderId) {
  const dedupeKey = `ga4_purchase_${orderId}`;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) return true;
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(dedupeKey, '1');
  } catch {
    /* ignore */
  }
  return false;
}

/** SPA route change — initial page_view comes from gtag config in index.html */
export function gtmPageView() {
  if (typeof window === 'undefined') return;
  sendEvent('page_view', {
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
    page_location: window.location.href
  });
}

export function gtmViewItem(product) {
  const item = mapProductItem(product, 1);
  if (!item) return;

  sendEvent('view_item', {
    currency: CURRENCY,
    value: item.price,
    items: [item]
  });
}

export function gtmAddToCart(product, quantity = 1) {
  const item = mapProductItem(product, quantity);
  if (!item) return;

  sendEvent('add_to_cart', {
    currency: CURRENCY,
    value: Math.round(item.price * item.quantity * 100) / 100,
    items: [item]
  });
}

export function gtmBeginCheckout({ value, currency = CURRENCY, cart, numItems }) {
  const items = cartToItems(cart);
  const computedValue =
    value != null
      ? Math.round(Number(value) * 100) / 100
      : items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  sendEvent('begin_checkout', {
    currency,
    value: Math.round(computedValue * 100) / 100,
    items: items.length ? items : undefined,
    num_items: numItems || items.reduce((n, i) => n + i.quantity, 0) || undefined
  });
}

export function gtmSignUp({ method = 'email' } = {}) {
  sendEvent('sign_up', { method });
}

export function gtmPurchase(order) {
  const orderId = String(order?._id || '').trim();
  if (!orderId || shouldSkipPurchase(orderId)) return;

  const items = orderToItems(order);
  sendEvent('purchase', {
    transaction_id: orderId,
    currency: CURRENCY,
    value: purchaseValue(order),
    items,
    num_items: items.reduce((n, i) => n + i.quantity, 0)
  });
}
