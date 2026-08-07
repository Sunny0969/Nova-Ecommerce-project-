import api from './client';

/**
 * Stripe — `/api/stripe/*`
 */
export const stripeAPI = {
  createPaymentIntent: (body) => api.post('/api/stripe/create-payment-intent', body),
  guestCreatePaymentIntent: (body) =>
    api.post('/api/stripe/guest/create-payment-intent', body, { skipAuthRedirect: true }),
  guestConfirm: (body) => api.post('/api/stripe/guest/confirm', body, { skipAuthRedirect: true })
};
