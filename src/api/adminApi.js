import api from './client';

/**
 * Admin API — import only from admin/staff pages (never from storefront).
 */
export const adminAPI = {
  dashboard: {
    stats: () => api.get('/api/admin/dashboard/stats'),
    revenueChart: (params) =>
      api.get('/api/admin/dashboard/revenue-chart', { params }),
    ordersChart: () => api.get('/api/admin/dashboard/orders-chart')
  },
  products: {
    list: (params) => api.get('/api/products', { params }),
    listAdmin: (params) => api.get('/api/admin/products', { params }),
    listIds: (params) => api.get('/api/admin/products/ids', { params }),
    exportCatalog: (params) => api.get('/api/admin/products/export', { params }),
    pendingApprovals: () => api.get('/api/admin/products/pending'),
    approve: (id) => api.post(`/api/admin/products/${encodeURIComponent(id)}/approve`, {}),
    reject: (id, body) => api.post(`/api/admin/products/${encodeURIComponent(id)}/reject`, body || {}),
    getOneForEdit: (id) => api.get(`/api/admin/products/${encodeURIComponent(id)}`),
    bulk: (body) => api.post('/api/admin/products/bulk', body),
    getOne: (idOrSlug) => api.get(`/api/products/${encodeURIComponent(idOrSlug)}`),
    create: (formData) =>
      api.post('/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }),
    update: (id, body, options = {}) => {
      const isFd = typeof FormData !== 'undefined' && body instanceof FormData;
      if (isFd || options.asFormData) {
        return api.put(`/api/products/${id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 0,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });
      }
      return api.put(`/api/products/${id}`, body);
    },
    updateStock: (id, stock) => api.patch(`/api/products/${id}/stock`, { stock }),
    delete: (id, hard = false) =>
      api.delete(`/api/products/${id}`, hard ? { params: { hard: 'true' } } : undefined)
  },
  staff: {
    list: () => api.get('/api/admin/staff'),
    create: (body) => api.post('/api/admin/staff/create', body),
    updatePermissions: (id, permissions) =>
      api.put(`/api/admin/staff/${encodeURIComponent(id)}/permissions`, { permissions }),
    block: (id, durationHours) =>
      api.post(`/api/admin/staff/${encodeURIComponent(id)}/block`, { duration: durationHours }),
    unblock: (id) => api.post(`/api/admin/staff/${encodeURIComponent(id)}/unblock`, {}),
    remove: (id) => api.delete(`/api/admin/staff/${encodeURIComponent(id)}`)
  },
  orders: {
    stats: () => api.get('/api/admin/orders/stats'),
    list: (params) => api.get('/api/admin/orders', { params }),
    getOne: (id) => api.get(`/api/admin/orders/${id}`),
    getReviews: (id) => api.get(`/api/admin/orders/${encodeURIComponent(id)}/reviews`),
    updateStatus: (id, body) => api.put(`/api/admin/orders/${id}/status`, body),
    updateTracking: (id, body) => api.put(`/api/admin/orders/${id}/tracking`, body),
    markPaid: (id, body) => api.put(`/api/admin/orders/${id}/paid`, body),
    updatePaymentProof: (id, body) => api.put(`/api/admin/orders/${id}/payment-proof`, body)
  },
  customers: {
    list: (params) => api.get('/api/admin/customers', { params }),
    getOne: (id) => api.get(`/api/admin/customers/${id}`),
    ban: (id, body) => api.put(`/api/admin/customers/${id}/ban`, body),
    delete: (id) => api.delete(`/api/admin/customers/${id}`)
  },
  coupons: {
    list: () => api.get('/api/admin/coupons'),
    create: (body) => api.post('/api/admin/coupons', body),
    update: (id, body) => api.put(`/api/admin/coupons/${id}`, body),
    toggle: (id) => api.patch(`/api/admin/coupons/${id}/toggle`),
    delete: (id) => api.delete(`/api/admin/coupons/${id}`)
  },
  categories: {
    list: () => api.get('/api/categories'),
    listAll: () => api.get('/api/admin/categories'),
    getBySlug: (slug) => api.get(`/api/categories/${encodeURIComponent(slug)}`),
    reorder: (body) => api.put('/api/categories/reorder', body),
    create: (formData) =>
      api.post('/api/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
    update: (id, body, options = {}) => {
      const isFd = typeof FormData !== 'undefined' && body instanceof FormData;
      if (isFd || options.asFormData) {
        return api.put(`/api/categories/${id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return api.put(`/api/categories/${id}`, body);
    },
    delete: (id) => api.delete(`/api/categories/${id}`)
  },
  subcategories: {
    list: (categorySlug = 'clothing') =>
      api.get('/api/admin/subcategories', { params: { category: categorySlug } }),
    create: (body) => api.post('/api/admin/subcategories', body),
    update: (id, body) => api.put(`/api/admin/subcategories/${encodeURIComponent(id)}`, body),
    delete: (id) => api.delete(`/api/admin/subcategories/${encodeURIComponent(id)}`)
  },
  storeSettings: {
    get: () => api.get('/api/admin/store-settings'),
    update: (body) => api.put('/api/admin/store-settings', body)
  },
  fraud: {
    logs: (params) => api.get('/api/admin/fraud/logs', { params }),
    stats: () => api.get('/api/admin/fraud/stats'),
    approveLog: (id, body) =>
      api.put(`/api/admin/fraud/logs/${encodeURIComponent(id)}/approve`, body || {}),
    rejectLog: (id, body) =>
      api.put(`/api/admin/fraud/logs/${encodeURIComponent(id)}/reject`, body || {}),
    blocklist: (params) => api.get('/api/admin/fraud/blocklist', { params }),
    addBlocklist: (body) => api.post('/api/admin/fraud/blocklist', body),
    removeBlocklist: (id) =>
      api.delete(`/api/admin/fraud/blocklist/${encodeURIComponent(id)}`)
  },
  notifications: {
    stats: () => api.get('/api/admin/notifications/stats'),
    promptLogs: (params) => api.get('/api/admin/notifications/prompt-logs', { params }),
    subscribers: (params) => api.get('/api/admin/notifications/subscribers', { params })
  },
  blogs: {
    list: (params) => api.get('/api/admin/blogs', { params }),
    stats: () => api.get('/api/admin/blogs/stats'),
    update: (id, body) => api.put(`/api/admin/blogs/${encodeURIComponent(id)}`, body),
    publish: (id) => api.put(`/api/admin/blogs/${encodeURIComponent(id)}/publish`, {}),
    unpublish: (id) => api.put(`/api/admin/blogs/${encodeURIComponent(id)}/unpublish`, {}),
    delete: (id) => api.delete(`/api/admin/blogs/${encodeURIComponent(id)}`),
    generateAi: () => api.post('/api/admin/blog/ai/generate', {})
  }
};

export const whatsappChatAPI = {
  status: () => api.get('/api/chat/status'),
  send: (body) => api.post('/api/chat/send-to-whatsapp', body)
};

export const chatbotAPI = {
  message: (body) => api.post('/api/chatbot/message', body)
};
