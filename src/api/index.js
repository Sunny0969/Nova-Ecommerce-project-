import api from './axios';

/**
 * Central API entry — `import ... from 'api'`.
 * Create React App: set `REACT_APP_API_URL` in `.env.production`
 */

export default api;

export * from './axios';
export * from './blog';

/* ============================================================
   Staff APIs
   ============================================================ */

export const staffAPI = {
  login: (body) => api.post('/api/staff/login', body),
  getMe: () => api.get('/api/staff/me'),
  logout: () => Promise.resolve()
};