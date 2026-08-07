import api from './client';

/** Public blog APIs (no auth required) */
export const blogAPI = {
  list: (params) => api.get('/api/blog/posts', { params }),
  getBySlug: (slug) => api.get(`/api/blog/posts/${encodeURIComponent(slug)}`),
  // optional endpoint placeholder
  categories: () => api.get('/api/blog/categories')
};

