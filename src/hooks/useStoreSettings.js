import { useCallback, useEffect, useRef, useState } from 'react';
import { storeSettingsAPI } from 'api';

const DEFAULT_POLL_MS = 12000;

/**
 * Loads shipping/tax from the same API admin saves to.
 * Polls + refetches on tab focus so customer prices stay in sync with admin changes.
 */
export function useStoreSettings({ pollMs = DEFAULT_POLL_MS } = {}) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const updatedAtRef = useRef(null);

  const applyResponse = useCallback((data) => {
    if (!data || typeof data !== 'object') return;
    const nextUpdated = data.updatedAt || null;
    if (updatedAtRef.current && nextUpdated && updatedAtRef.current === nextUpdated) {
      return;
    }
    updatedAtRef.current = nextUpdated;
    setSettings(data);
    setError(null);
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await storeSettingsAPI.get();
      applyResponse(res.data?.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    storeSettingsAPI
      .get()
      .then((res) => {
        if (cancelled) return;
        applyResponse(res.data?.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyResponse]);

  useEffect(() => {
    const onFocus = () => {
      refetch();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  useEffect(() => {
    if (!pollMs || pollMs < 1000) return undefined;
    const id = window.setInterval(() => {
      refetch();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [refetch, pollMs]);

  return { settings, loading, error, refetch };
};
