import api from './client';

/**
 * Orders — `/api/orders/*` (JWT). Checkout: COD, Easypaisa, or Stripe card.
 */
export const ordersAPI = {
  place: (body) => api.post('/api/orders/place', body),

  guestPlace: (body) => {
    if (body instanceof FormData) {
      return api.post('/api/orders/guest/place', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipAuthRedirect: true
      });
    }
    return api.post('/api/orders/guest/place', body, { skipAuthRedirect: true });
  },

  confirm: (body) => api.post('/api/orders/confirm', body),

  create: (body) => api.post('/api/orders/place', body),

  getMyOrders: (params) => api.get('/api/orders/my-orders', { params }),

  getOne: (id) => api.get(`/api/orders/${id}`, { skipAuthRedirect: true }),

  cancel: (id, body) => api.post(`/api/orders/cancel/${id}`, body || {}),

  uploadPaymentProof: (id, formData) =>
    api.post(`/api/orders/${id}/payment-proof`, formData)
};
