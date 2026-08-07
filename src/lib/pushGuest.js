const GUEST_KEY = 'bazaar_push_guest';
const PROMPT_KEY = 'bazaar_push_prompt';

export function getOrCreateGuestKey() {
  if (typeof window === 'undefined') return '';
  try {
    let key = localStorage.getItem(GUEST_KEY);
    if (!key) {
      key =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `g_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_KEY, key);
    }
    return key;
  } catch {
    return '';
  }
}

/** @returns {'allowed'|'dismissed'|null} */
export function getPushPromptChoice() {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(PROMPT_KEY);
    return v === 'allowed' || v === 'dismissed' ? v : null;
  } catch {
    return null;
  }
}

export function setPushPromptChoice(choice) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROMPT_KEY, choice);
  } catch {
    /* ignore */
  }
}

/** Send Allow / Not now choice to backend for admin reporting */
export async function logPushPromptChoice(choice, { subscribed = false, browserPermission } = {}) {
  try {
    const { notificationsAPI } = await import('../api/notifications');
    await notificationsAPI.recordPromptResponse({
      choice,
      guestKey: getOrCreateGuestKey(),
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : '',
      subscribed,
      browserPermission:
        browserPermission ||
        (typeof Notification !== 'undefined' ? Notification.permission : 'unknown')
    });
  } catch {
    /* non-blocking */
  }
}
