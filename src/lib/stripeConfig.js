/** Stripe publishable key — always loaded from backend env via /api/public/stripe-config. */
export function getStripePublishableKey() {
  if (typeof window !== 'undefined') {
    const runtime = window.__REACT_APP_STRIPE_PUBLISHABLE_KEY__;
    if (runtime && String(runtime).trim()) {
      return String(runtime).trim();
    }
  }
  return (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '').trim();
}
