export const SESSION_ID_KEY = 'nova_shop_session_id_v1';

function randomId() {
  // Not cryptographic; good enough for anonymous session tracking.
  return `sid_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export function getSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const sid = randomId();
    localStorage.setItem(SESSION_ID_KEY, sid);
    return sid;
  } catch {
    return randomId();
  }
}

