import api from './client';

export { TOKEN_KEY } from './client';

/**
 * Auth — `/api/auth/*`
 * Note: `updateProfile`, `forgotPassword`, `resetPassword` expect matching backend routes.
 */
export const authAPI = {
  login: (body) =>
    api.post('/api/auth/login', body, { skipAuthRedirect: true }),

  register: (body) =>
    api.post('/api/auth/register', body, { skipAuthRedirect: true }),

  logout: () =>
    api.post('/api/auth/logout', {}, { skipAuthRedirect: true }),

  getMe: () => api.get('/api/auth/me'),

  saveShippingAddress: (body) => api.patch('/api/auth/me/shipping', body),

  updateProfile: (body) => api.patch('/api/auth/profile', body),

  changePassword: (body) => api.post('/api/auth/change-password', body),

  uploadAvatar: (formData) => api.post('/api/auth/avatar', formData),

  listAddresses: () => api.get('/api/auth/addresses'),

  createAddress: (body) => api.post('/api/auth/addresses', body),

  updateAddress: (id, body) => api.patch(`/api/auth/addresses/${encodeURIComponent(id)}`, body),

  deleteAddress: (id) => api.delete(`/api/auth/addresses/${encodeURIComponent(id)}`),

  setDefaultAddress: (id) =>
    api.patch(`/api/auth/addresses/${encodeURIComponent(id)}/default`, {}),

  myReviews: () => api.get('/api/auth/reviews'),

  forgotPassword: (body) =>
    api.post('/api/auth/forgot-password', body, { skipAuthRedirect: true }),

  resetPassword: (body) =>
    api.post('/api/auth/reset-password', body, { skipAuthRedirect: true })
};
