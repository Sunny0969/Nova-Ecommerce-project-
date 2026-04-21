import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Minimize2, Send, Volume2, VolumeX } from 'lucide-react';
import { chatbotAPI } from '../api/axios';
import { apiMessage } from '../lib/api';
import { getSessionId } from '../lib/sessionId';

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function useDebouncedValue(value, delayMs) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return v;
}

const QUICK_REPLIES = ['Track my order', 'Return policy', 'Contact support'];

export default function ChatWidget() {
  const { pathname } = useLocation();
  const sessionId = useMemo(() => getSessionId(), []);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [typing, setTyping] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem('nova_chat_sound') !== 'off';
    } catch {
      return true;
    }
  });

  const [input, setInput] = useState('');
  const debouncedInput = useDebouncedValue(input, 50);

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem('nova_chat_history_v1');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const persistMessages = useCallback((next) => {
    setMessages(next);
    try {
      localStorage.setItem('nova_chat_history_v1', JSON.stringify(next.slice(-60)));
    } catch {
      // ignore
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
      window.setTimeout(scrollToBottom, 80);
    }
  }, [open, minimized, scrollToBottom]);

  const playDing = useCallback(() => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore
    }
  }, [soundOn]);

  const send = useCallback(
    async (text) => {
      const t = String(text || '').trim();
      if (!t || typing) return;

      const next = [...messages, { role: 'user', content: t, time: nowTime() }];
      persistMessages(next);
      setInput('');
      setOpen(true);
      setMinimized(false);
      setTyping(true);

      try {
        const res = await chatbotAPI.message({
          message: t,
          conversationHistory: next.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          sessionId
        });
        const reply = res.data?.data?.reply || 'Sorry — I could not answer that.';
        const suggested = res.data?.data?.suggestedActions || [];
        const escalated = Boolean(res.data?.data?.escalated);
        const final = [
          ...next,
          { role: 'assistant', content: reply, time: nowTime(), suggestedActions: suggested, escalated }
        ];
        persistMessages(final);
        playDing();
      } catch (e) {
        persistMessages([
          ...next,
          { role: 'assistant', content: apiMessage(e, 'Chat failed'), time: nowTime() }
        ]);
      } finally {
        setTyping(false);
        window.setTimeout(scrollToBottom, 60);
      }
    },
    [messages, persistMessages, typing, sessionId, playDing, scrollToBottom]
  );

  // Smart triggers
  useEffect(() => {
    // Auto-open after 30s on checkout page
    if (pathname !== '/checkout') return;
    const t = window.setTimeout(() => {
      setOpen(true);
      setMinimized(false);
      if (messages.length === 0) {
        persistMessages([
          { role: 'assistant', content: 'Need help completing your order?', time: nowTime() }
        ]);
      }
    }, 30_000);
    return () => window.clearTimeout(t);
  }, [pathname, messages.length, persistMessages]);

  useEffect(() => {
    // Checkout page > 3 minutes prompt
    if (pathname !== '/checkout') return;
    const t = window.setTimeout(() => {
      setOpen(true);
      setMinimized(false);
      persistMessages((prev) => {
        const p = Array.isArray(prev) ? prev : [];
        return [...p, { role: 'assistant', content: 'Still there—want help with checkout?', time: nowTime() }];
      });
    }, 180_000);
    return () => window.clearTimeout(t);
  }, [pathname, persistMessages]);

  useEffect(() => {
    // Product viewed 3 times trigger (localStorage counter updated here)
    const m = pathname.match(/^\/shop\/(.+)$/);
    if (!m) return;
    const slug = decodeURIComponent(m[1] || '');
    if (!slug) return;
    try {
      const key = `nova_view_${slug}`;
      const n = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      const next = n + 1;
      localStorage.setItem(key, String(next));
      if (next === 3) {
        setOpen(true);
        setMinimized(false);
        persistMessages((prev) => {
          const p = Array.isArray(prev) ? prev : [];
          return [...p, { role: 'assistant', content: 'Want to know more about this product?', time: nowTime() }];
        });
      }
    } catch {
      // ignore
    }
  }, [pathname, persistMessages]);

  useEffect(() => {
    // Cart abandonment: if user hides tab from cart/shop, prompt on next return
    const onVis = () => {
      try {
        if (document.visibilityState === 'hidden') {
          localStorage.setItem('nova_cart_abandon_hint', '1');
        } else if (document.visibilityState === 'visible') {
          const flag = localStorage.getItem('nova_cart_abandon_hint');
          if (flag === '1') {
            localStorage.removeItem('nova_cart_abandon_hint');
            if (!open) {
              setOpen(true);
              setMinimized(false);
              persistMessages((prev) => {
                const p = Array.isArray(prev) ? prev : [];
                return [
                  ...p,
                  { role: 'assistant', content: 'Wait—can I help you with anything?', time: nowTime() }
                ];
              });
            }
          }
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [open, persistMessages]);

  const headerStatus = 'Online';

  return (
    <>
      {!open ? (
        <button
          type="button"
          className="chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Open Nova AI chat"
        >
          <MessageCircle size={20} aria-hidden />
          <span className="chat-fab__label">Nova AI</span>
        </button>
      ) : (
        <div className={`chat-panel ${minimized ? 'chat-panel--min' : ''}`} aria-label="Nova AI chat">
          <div className="chat-panel__header">
            <div className="chat-panel__title">
              <span className="chat-panel__dot" aria-hidden />
              Nova AI <span className="chat-panel__status">{headerStatus}</span>
            </div>
            <div className="chat-panel__actions">
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => {
                  const next = !soundOn;
                  setSoundOn(next);
                  try {
                    localStorage.setItem('nova_chat_sound', next ? 'on' : 'off');
                  } catch {
                    // ignore
                  }
                }}
                aria-label={soundOn ? 'Disable sound' : 'Enable sound'}
                title={soundOn ? 'Sound on' : 'Sound off'}
              >
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => setMinimized((x) => !x)}
                aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
              >
                <Minimize2 size={16} />
              </button>
              <button type="button" className="chat-icon-btn" onClick={() => setOpen(false)} aria-label="Close chat">
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="chat-panel__messages" ref={listRef}>
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <p className="chat-empty__title">Hi, I’m Nova.</p>
                    <p className="chat-empty__text">Ask about orders, shipping, returns, or products.</p>
                    <div className="chat-quick">
                      {QUICK_REPLIES.map((q) => (
                        <button key={q} type="button" className="chat-chip" onClick={() => send(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div key={idx} className={`chat-msg chat-msg--${m.role}`}>
                      <div className="chat-msg__bubble">{m.content}</div>
                      <div className="chat-msg__meta">{m.time}</div>
                      {m.role === 'assistant' && Array.isArray(m.suggestedActions) && m.suggestedActions.length > 0 && (
                        <div className="chat-quick">
                          {m.suggestedActions.slice(0, 3).map((q) => (
                            <button key={q} type="button" className="chat-chip" onClick={() => send(q)}>
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {typing && (
                  <div className="chat-msg chat-msg--assistant">
                    <div className="chat-msg__bubble chat-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>

              <form
                className="chat-panel__input"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(debouncedInput);
                }}
              >
                <input
                  ref={inputRef}
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Nova…"
                  aria-label="Message"
                />
                <button type="submit" className="chat-send" disabled={typing || !String(input).trim()}>
                  <Send size={16} aria-hidden />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

