import api from './client';

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}

export const notificationsAPI = {
  getVapidPublicKey() {
    return api.get('/api/notifications/vapid-public-key', { skipAuthRedirect: true }).then((res) => unwrap(res));
  },

  getStatus(endpoint) {
    const params = endpoint ? { endpoint } : {};
    return api
      .get('/api/notifications/status', { params, skipAuthRedirect: true })
      .then((res) => unwrap(res));
  },

  subscribe(subscription, guestKey) {
    return api
      .post(
        '/api/notifications/subscribe',
        { subscription, guestKey },
        { skipAuthRedirect: true }
      )
      .then((res) => unwrap(res));
  },

  unsubscribe(endpoint) {
    return api
      .post('/api/notifications/unsubscribe', endpoint ? { endpoint } : {}, { skipAuthRedirect: true })
      .then((res) => unwrap(res));
  },

  getPreferences() {
    return api.get('/api/notifications/preferences').then((res) => unwrap(res));
  },

  updatePreferences(patch) {
    return api.patch('/api/notifications/preferences', patch).then((res) => unwrap(res));
  },

  recordPromptResponse(body) {
    return api
      .post('/api/notifications/prompt-response', body, { skipAuthRedirect: true })
      .then((res) => unwrap(res));
  }
};
