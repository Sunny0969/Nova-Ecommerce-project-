import api from './client';

/**
 * Meta Conversions API mirror — `/api/meta/*` (browser → server, dedup with pixel eventID).
 */
export const metaAPI = {
  trackEvent: (body) => api.post('/api/meta/event', body, { skipAuthRedirect: true }),

  getStatus: () => api.get('/api/meta/status', { skipAuthRedirect: true })
};
