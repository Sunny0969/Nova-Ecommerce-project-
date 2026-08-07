import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { getPushPromptChoice, setPushPromptChoice, logPushPromptChoice } from '../lib/pushGuest';

const PROMPT_DELAY_MS = 1800;

/**
 * First-visit allow / disallow prompt — no navbar icon, no login required.
 */
export default function PushNotificationPrompt() {
  const { user } = useAuth();
  const { support, permission, subscribed, loading, subscribe } = useNotifications({
    userId: user?._id || null,
    enabled: true
  });
  const [visible, setVisible] = useState(false);
  const deniedLoggedRef = useRef(false);

  useEffect(() => {
    if (!support.supported) return undefined;
    if (getPushPromptChoice()) return undefined;
    if (permission === 'denied') {
      setPushPromptChoice('dismissed');
      if (!deniedLoggedRef.current) {
        deniedLoggedRef.current = true;
        logPushPromptChoice('denied', { subscribed: false, browserPermission: 'denied' });
      }
      return undefined;
    }

    if (permission === 'granted' && subscribed) {
      setPushPromptChoice('allowed');
      return undefined;
    }

    if (permission === 'granted' && !subscribed && !loading) {
      subscribe().then((ok) => {
        if (ok) {
          setPushPromptChoice('allowed');
          logPushPromptChoice('allowed', { subscribed: true, browserPermission: 'granted' });
        }
      });
      return undefined;
    }

    if (permission !== 'default') return undefined;

    const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [support.supported, permission, subscribed, loading, subscribe]);

  useEffect(() => {
    if (!user?._id || !subscribed || loading) return;
    subscribe().catch(() => {});
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAllow = async () => {
    const perm = await (typeof Notification !== 'undefined'
      ? Notification.requestPermission()
      : Promise.resolve('denied'));

    if (perm !== 'granted') {
      setPushPromptChoice('dismissed');
      setVisible(false);
      await logPushPromptChoice(perm === 'denied' ? 'denied' : 'dismissed', {
        subscribed: false,
        browserPermission: perm
      });
      return;
    }

    const ok = await subscribe();
    setPushPromptChoice(ok ? 'allowed' : 'dismissed');
    setVisible(false);
    await logPushPromptChoice(ok ? 'allowed' : 'denied', {
      subscribed: ok,
      browserPermission: perm
    });
  };

  const handleDismiss = async () => {
    setPushPromptChoice('dismissed');
    setVisible(false);
    await logPushPromptChoice('dismissed', {
      subscribed: false,
      browserPermission: typeof Notification !== 'undefined' ? Notification.permission : 'default'
    });
  };

  if (!visible) return null;

  return (
    <div className="push-prompt" role="dialog" aria-labelledby="push-prompt-title" aria-modal="true">
      <div className="push-prompt__card">
        <div className="push-prompt__icon" aria-hidden="true">
          <Bell size={28} strokeWidth={1.75} />
        </div>
        <h2 id="push-prompt-title" className="push-prompt__title">
          Get updates on deals &amp; new arrivals
        </h2>
        <p className="push-prompt__text">
          Allow notifications to hear about sales and new products. No account needed.
        </p>
        <div className="push-prompt__actions">
          <button
            type="button"
            className="push-prompt__btn push-prompt__btn--primary"
            disabled={loading}
            onClick={handleAllow}
          >
            {loading ? 'Please wait…' : 'Allow'}
          </button>
          <button
            type="button"
            className="push-prompt__btn push-prompt__btn--ghost"
            disabled={loading}
            onClick={handleDismiss}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
