import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, X, Phone } from 'lucide-react';
import { whatsappChatAPI } from 'api';
import { getSessionId } from '../../lib/sessionId';
import { joinChatSession, getWhatsAppSocket } from '../../lib/whatsappSocket';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164
} from '../../utils/businessContact';

const STORAGE_KEY = 'bazaar_whatsapp_chat_v1';

const WELCOME = {
  sender: 'bot',
  text: 'Salam! Bazaar Support mein khushamdeed 👋\nYahan message likhein — team ko notify ho jayegi. Reply yahi chat mein aayegi.',
  time: null
};

const QUICK_REPLIES = ['Track my order', 'Delivery time?', 'Return policy'];

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function confirmationText(delivered) {
  if (delivered === true || delivered === 'whatsapp') {
    return 'Shukriya! Hamari team ko WhatsApp par message mil gaya hai. Jald reply yahi chat mein aayega.';
  }
  return 'Shukriya! Aapka message receive ho gaya hai. Hum jald reply karenge.';
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) && parsed.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

function WhatsAppIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function WhatsAppChatWidget() {
  const { pathname } = useLocation();
  const sessionId = useMemo(() => getSessionId(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [liveRelay, setLiveRelay] = useState(null);
  const [chatHistory, setChatHistory] = useState(loadHistory);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const waLink = useMemo(() => {
    const text = encodeURIComponent('Salam! Bazaar PK website se contact kar raha/rahi hoon.');
    const phone = businessPhoneE164.replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${text}`;
  }, []);

  const waLinkWithMessage = useCallback((userText) => {
    const phone = businessPhoneE164.replace(/\D/g, '');
    const body = encodeURIComponent(`Website chat:\n${userText}`);
    return `https://wa.me/${phone}?text=${body}`;
  }, []);

  const persist = useCallback((next) => {
    setChatHistory((prev) => {
      const updated = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(-40)));
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 80);
      scrollToBottom();
    }
  }, [isOpen, chatHistory.length, scrollToBottom]);

  useEffect(() => {
    let cancelled = false;
    whatsappChatAPI
      .status()
      .then((res) => {
        if (!cancelled) setLiveRelay(Boolean(res.data?.data?.liveRelay));
      })
      .catch(() => {
        if (!cancelled) setLiveRelay(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    joinChatSession(sessionId);
    const socket = getWhatsAppSocket();
    if (!socket) return undefined;

    const onReply = (data) => {
      const text = String(data?.text || '').trim();
      if (!text) return;
      persist((prev) => [...prev, { sender: 'admin', text, time: nowTime() }]);
    };

    socket.on('admin_whatsapp_reply', onReply);
    return () => {
      socket.off('admin_whatsapp_reply', onReply);
    };
  }, [isOpen, sessionId, persist]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    setMessage('');
    setSending(true);
    persist((prev) => [...prev, { sender: 'user', text, time: nowTime() }]);

    try {
      const res = await whatsappChatAPI.send({
        message: text,
        sessionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : ''
      });

      if (res.data?.success) {
        const delivered = res.data?.data?.delivered;
        persist((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: confirmationText(delivered),
            time: nowTime()
          }
        ]);
      }
    } catch {
      persist((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Message abhi deliver nahi ho saka. Neeche "Direct WhatsApp" button se 0348 3510584 par message bhejein.',
          time: nowTime(),
          waFallback: text
        }
      ]);
    } finally {
      setSending(false);
      window.setTimeout(scrollToBottom, 60);
    }
  };

  const sendQuick = async (q) => {
    if (sending) return;
    setSending(true);
    persist((prev) => [...prev, { sender: 'user', text: q, time: nowTime() }]);
    try {
      const res = await whatsappChatAPI.send({
        message: q,
        sessionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : ''
      });
      persist((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: confirmationText(res.data?.data?.delivered),
          time: nowTime()
        }
      ]);
    } catch {
      persist((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Neeche Direct WhatsApp se 0348 3510584 par message bhejein.',
          time: nowTime(),
          waFallback: q
        }
      ]);
    } finally {
      setSending(false);
      window.setTimeout(scrollToBottom, 60);
    }
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
    return null;
  }

  return (
    <div className="wa-chat-root" aria-live="polite">
      {!isOpen ? (
        <button
          type="button"
          className="wa-chat-fab"
          onClick={() => setIsOpen(true)}
          aria-label={`Open ${businessDisplayName} WhatsApp support chat`}
        >
          <WhatsAppIcon size={30} />
          <span className="wa-chat-fab__pulse" aria-hidden />
        </button>
      ) : (
        <div className="wa-chat-panel nova-chat-panel-enter" role="dialog" aria-label="WhatsApp support chat">
          <header className="wa-chat-header">
            <div className="wa-chat-header__avatar" aria-hidden>
              <WhatsAppIcon size={22} />
            </div>
            <div className="wa-chat-header__meta">
              <h2 className="wa-chat-header__title">{businessDisplayName} Support</h2>
              <p className="wa-chat-header__status">
                <span className="wa-chat-header__dot" aria-hidden />
                {liveRelay ? 'Online — WhatsApp relay active' : 'Online — reply via WhatsApp'}
              </p>
            </div>
            <button
              type="button"
              className="wa-chat-header__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </header>

          <div className="wa-chat-body" ref={listRef}>
            <div className="wa-chat-body__inner">
              {chatHistory.map((msg, index) => (
                <div
                  key={`${index}-${msg.sender}`}
                  className={`wa-chat-bubble wa-chat-bubble--${msg.sender} nova-chat-msg-enter`}
                >
                  <p className="wa-chat-bubble__text">{msg.text}</p>
                  {msg.time ? <time className="wa-chat-bubble__time">{msg.time}</time> : null}
                  {msg.waFallback ? (
                    <a
                      className="wa-chat-bubble__wa-btn"
                      href={waLinkWithMessage(msg.waFallback)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open WhatsApp
                    </a>
                  ) : null}
                </div>
              ))}
              {sending ? (
                <div className="wa-chat-bubble wa-chat-bubble--bot">
                  <div className="wa-chat-typing" aria-label="Sending">
                    <span className="nova-chat-typing-dot" />
                    <span className="nova-chat-typing-dot" />
                    <span className="nova-chat-typing-dot" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {chatHistory.length <= 2 ? (
            <div className="wa-chat-quick">
              {QUICK_REPLIES.map((q) => (
                <button key={q} type="button" className="wa-chat-quick__chip" onClick={() => sendQuick(q)}>
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          <form className="wa-chat-compose" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="wa-chat-compose__input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Urdu / English likhein…"
              maxLength={2000}
              autoComplete="off"
              aria-label="Your message"
            />
            <button
              type="submit"
              className="wa-chat-compose__send"
              disabled={sending || !message.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>

          <a className="wa-chat-wa-link" href={waLink} target="_blank" rel="noopener noreferrer">
            <Phone size={14} aria-hidden />
            Direct WhatsApp: {businessPhoneDisplay} ({businessPhoneE164})
          </a>
        </div>
      )}
    </div>
  );
}
