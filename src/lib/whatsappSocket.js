import { io } from 'socket.io-client';
import { resolveStoreApiOrigin } from '../config/apiOrigin';

let socket;

export function getWhatsAppSocket() {
  if (typeof window === 'undefined') return null;

  if (socket?.connected) return socket;

  const origin = resolveStoreApiOrigin();
  if (!origin) return null;

  if (!socket) {
    socket = io(origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false
    });
  }

  if (!socket.connected) socket.connect();
  return socket;
}

export function joinChatSession(sessionId) {
  const s = getWhatsAppSocket();
  if (!s || !sessionId) return;
  const handler = () => {
    s.emit('join_chat_session', { sessionId });
  };
  if (s.connected) handler();
  else s.once('connect', handler);
}

export function disconnectWhatsAppSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
