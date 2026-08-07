import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationsAPI } from '../api/notifications';
import {
  getServiceWorkerRegistration,
  isServiceWorkerSupported,
  registerServiceWorker
} from '../lib/registerServiceWorker';
import { getOrCreateGuestKey } from '../lib/pushGuest';
import { apiMessage } from '../lib/api';

/** Convert VAPID public key (base64 URL) to Uint8Array for PushManager.subscribe */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

function detectSupport() {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      serviceWorker: false,
      pushManager: false,
      notificationApi: false
    };
  }
  const serviceWorker = isServiceWorkerSupported();
  const pushManager = serviceWorker && 'PushManager' in window;
  const notificationApi = 'Notification' in window;
  return {
    supported: serviceWorker && pushManager && notificationApi,
    serviceWorker,
    pushManager,
    notificationApi
  };
}

/**
 * Web push for guests and logged-in customers (no login required to subscribe).
 * @param {{ userId?: string, enabled?: boolean }} options
 */
export function useNotifications({ userId = null, enabled = true } = {}) {
  const support = useMemo(() => detectSupport(), []);
  const [permission, setPermission] = useState(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'default')
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vapidPublicKey, setVapidPublicKey] = useState(
    () => process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
  );

  const refreshStatus = useCallback(async () => {
    if (!enabled || !support.supported) {
      setSubscribed(false);
      return;
    }
    try {
      await registerServiceWorker();
      const registration = await getServiceWorkerRegistration();
      const browserSub = await registration?.pushManager?.getSubscription();
      if (!browserSub) {
        setSubscribed(false);
        return;
      }
      const endpoint = browserSub.endpoint;
      const status = await notificationsAPI.getStatus(endpoint);
      setSubscribed(Boolean(status?.subscribed));
    } catch {
      setSubscribed(false);
    }
  }, [enabled, support.supported]);

  useEffect(() => {
    if (!support.supported || vapidPublicKey) return;
    notificationsAPI
      .getVapidPublicKey()
      .then((data) => {
        if (data?.publicKey) setVapidPublicKey(data.publicKey);
      })
      .catch(() => {});
  }, [support.supported, vapidPublicKey]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus, userId]);

  const subscribe = useCallback(async () => {
    setError('');
    if (!support.supported) {
      setError('Push notifications are not supported in this browser.');
      return false;
    }
    if (!vapidPublicKey) {
      setError('Notifications are not configured on the server.');
      return false;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setError(perm === 'denied' ? 'Notifications are blocked in browser settings.' : 'Permission not granted.');
        return false;
      }

      await registerServiceWorker();
      const registration = await getServiceWorkerRegistration();
      if (!registration?.pushManager) {
        throw new Error('Push manager unavailable');
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      await notificationsAPI.subscribe(subscription.toJSON(), getOrCreateGuestKey());
      setSubscribed(true);
      return true;
    } catch (err) {
      setError(apiMessage(err, 'Could not enable notifications'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [support.supported, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const registration = await getServiceWorkerRegistration();
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        await notificationsAPI.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      } else {
        await notificationsAPI.unsubscribe();
      }
      setSubscribed(false);
      return true;
    } catch (err) {
      setError(apiMessage(err, 'Could not disable notifications'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    support,
    permission,
    subscribed,
    loading,
    error,
    vapidPublicKey,
    subscribe,
    unsubscribe,
    refreshStatus,
    canPrompt: support.supported && permission !== 'denied'
  };
}
