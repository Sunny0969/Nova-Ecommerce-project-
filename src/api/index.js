import api from './client';

/**
 * Narrow public entry — blog + staff helpers only.
 * Storefront code should import from `api/client`, `api/auth`, `api/storefront`, etc.
 */

export default api;

export { blogAPI } from './blog';

export const staffAPI = {
  login: (body) => api.post('/api/staff/login', body),
  getMe: () => api.get('/api/staff/me'),
  logout: () => Promise.resolve()
};
