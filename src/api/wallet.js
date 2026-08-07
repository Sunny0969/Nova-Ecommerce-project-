import api from './client';

/**
 * Wallet — `/api/wallet/*` (JWT). Balance, top-up, checkout preview.
 */
export const walletAPI = {
  getSummary: () => api.get('/api/wallet'),

  getTransactions: (params) => api.get('/api/wallet/transactions', { params }),

  preview: (body) => api.post('/api/wallet/preview', body),

  topUpIntent: (body) => api.post('/api/wallet/top-up/intent', body),

  topUpConfirm: (body) => api.post('/api/wallet/top-up/confirm', body)
};
