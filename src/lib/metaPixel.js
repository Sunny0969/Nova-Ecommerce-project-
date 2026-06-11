import {
  gtmPageView,
  gtmViewItem,
  gtmAddToCart,
  gtmBeginCheckout,
  gtmSignUp,
  gtmPurchase
} from './gtmAnalytics';

export const META_PIXEL_ID = '1519068336295914';

function hasFbq() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

function currentUrl() {
  return typeof window !== 'undefined' ? window.location.href : '';
}

/** Meta Pixel base script loads from public/index.html (fbq). */
export function ensureMetaPixel() {
  return hasFbq();
}

function fbqTrack(event, payload, options) {
  if (!ensureMetaPixel()) return;
  if (options) {
    window.fbq('track', event, payload, options);
    return;
  }
  if (payload) {
    window.fbq('track', event, payload);
    return;
  }
  window.fbq('track', event);
}

function productId(product) {
  return String(product?._id || product?.id || product?.productId || '').trim();
}

function unitPrice(product) {
  return Number(product?.price) || 0;
}

/** Mirror pixel event to Conversions API with same eventId (deduplication). */
function mirrorToServer({ eventName, eventId, customData, email, phone, firstName, lastName }) {
  void import('api')
    .then(({ metaAPI }) =>
      metaAPI.trackEvent({
        eventName,
        eventId,
        eventSourceUrl: currentUrl(),
        email: email || undefined,
        phone: phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        fbc: readCookie('_fbc') || undefined,
        fbp: readCookie('_fbp') || undefined,
        customData: customData || undefined
      })
    )
    .catch(() => {
      /* CAPI optional — pixel still tracks */
    });
}

/** SPA route change — skip first load (index.html already sent PageView). */
export function trackPageView() {
  fbqTrack('PageView');
  gtmPageView();
}

export function trackViewContent(product, user) {
  const id = productId(product);
  if (!id) return;

  const eventId = `vc_${id}`;
  const payload = {
    content_name: product.name || 'Product',
    content_ids: [id],
    content_type: 'product',
    value: unitPrice(product),
    currency: 'PKR'
  };

  fbqTrack('ViewContent', payload, { eventID: eventId });
  mirrorToServer({
    eventName: 'ViewContent',
    eventId,
    customData: {
      currency: 'PKR',
      value: payload.value,
      contentIds: [id],
      contentType: 'product',
      contentName: product.name || 'Product'
    },
    email: user?.email
  });
  gtmViewItem(product);
}

export function trackAddToCart(product, quantity = 1, user) {
  const id = productId(product);
  if (!id) return;

  const qty = Math.max(1, Number(quantity) || 1);
  const price = unitPrice(product);
  const eventId = `atc_${id}_${Date.now()}`;

  const payload = {
    content_name: product.name || 'Product',
    content_ids: [id],
    content_type: 'product',
    value: Math.round(price * qty * 100) / 100,
    currency: 'PKR'
  };

  fbqTrack('AddToCart', payload, { eventID: eventId });
  mirrorToServer({
    eventName: 'AddToCart',
    eventId,
    customData: {
      currency: 'PKR',
      value: payload.value,
      contentIds: [id],
      contentType: 'product',
      contentName: product.name || 'Product'
    },
    email: user?.email
  });
  gtmAddToCart(product, qty);
}

export function trackInitiateCheckout({ value, currency = 'PKR', numItems, email, phone, cart }) {
  const eventId = `ico_${Date.now()}`;
  const payload = {
    value: Math.round(Number(value) * 100) / 100,
    currency,
    num_items: numItems || undefined,
    content_type: 'product'
  };

  fbqTrack('InitiateCheckout', payload, { eventID: eventId });
  mirrorToServer({
    eventName: 'InitiateCheckout',
    eventId,
    customData: {
      currency,
      value: payload.value,
      numItems: numItems || undefined,
      contentType: 'product'
    },
    email,
    phone
  });
  gtmBeginCheckout({ value: payload.value, currency, cart, numItems });
}

export function trackCompleteRegistration({ email, phone, eventId }) {
  const id = eventId || `reg_${String(email || '').trim().toLowerCase() || Date.now()}`;

  fbqTrack('CompleteRegistration', {}, { eventID: id });
  mirrorToServer({
    eventName: 'CompleteRegistration',
    eventId: id,
    email,
    phone
  });
  gtmSignUp({ method: 'email' });
}

/**
 * Browser Purchase — eventID must match backend CAPI eventId (order Mongo _id).
 */
export function trackPurchase(order) {
  const orderId = String(order?._id || '').trim();
  if (!orderId) return;

  const dedupeKey = `meta_purchase_${orderId}`;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) return;
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(dedupeKey, '1');
  } catch {
    /* ignore storage errors */
  }

  const total = Number(order.totalPrice) || 0;
  const wallet = Number(order.walletAmountUsed) || 0;
  const value = Math.round((total + wallet) * 100) / 100;

  const contentIds = (order.orderItems || [])
    .map((line) => {
      const ref = line.product;
      if (ref && typeof ref === 'object' && ref._id) return String(ref._id);
      return '';
    })
    .filter(Boolean);

  const payload = {
    value,
    currency: 'PKR',
    content_type: 'product',
    num_items: (order.orderItems || []).reduce(
      (n, line) => n + (Number(line.quantity) || 0),
      0
    )
  };

  if (contentIds.length) {
    payload.content_ids = contentIds;
  }

  fbqTrack('Purchase', payload, { eventID: orderId });
  gtmPurchase(order);
  /* Server Purchase is sent from backend on order place (same eventId for dedup). */
}
