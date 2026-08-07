import api from './client';

export const eventsAPI = {
  log: (body) => api.post('/api/events', body)
};
