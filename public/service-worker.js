/* eslint-disable no-restricted-globals */
/**
 * Web Push service worker — handles incoming push payloads and notification clicks.
 */

const DEFAULT_ICON = '/favicon.svg';
const DEFAULT_BADGE = '/favicon.svg';

function parsePushData(event) {
  if (!event.data) {
    return { title: 'Bazaar', body: 'You have a new notification.' };
  }
  try {
    return event.data.json();
  } catch {
    const text = event.data.text();
    return { title: 'Bazaar', body: text || 'You have a new notification.' };
  }
}

self.addEventListener('push', (event) => {
  const payload = parsePushData(event);
  const title = payload.title || 'Bazaar';
  const body = payload.body || '';
  const icon = payload.icon || DEFAULT_ICON;
  const badge = payload.badge || DEFAULT_BADGE;
  const tag = payload.tag || `bazaar-${Date.now()}`;
  const data = payload.data || {};

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: Boolean(payload.renotify),
    data: {
      url: data.url || '/shop',
      ...data
    },
    actions: Array.isArray(payload.actions)
      ? payload.actions
      : [
          { action: 'open', title: 'Open' },
          { action: 'close', title: 'Dismiss' }
        ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification?.data?.url || '/shop';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
