import staffApi from './staffAxios';

/** Staff categories API wrapper (uses staff token from localStorage) */
export const staffCategoriesAPI = {
  list: () => staffApi.get('/api/staff/categories'),
  create: (body) => staffApi.post('/api/staff/categories', body),
  update: (id, body) => staffApi.put(`/api/staff/categories/${encodeURIComponent(id)}`, body),
  delete: (id) => staffApi.delete(`/api/staff/categories/${encodeURIComponent(id)}`)
};


