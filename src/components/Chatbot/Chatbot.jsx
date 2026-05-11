import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  Minimize2,
  Send,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useChatbot } from '../../hooks/useChatbot';

const REACTIONS_KEY = 'chatbot_msg_reactions_v1';
const SOUND_PREF_KEY = 'nova_chatbot_ping';

function formatMessageTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function loadReactions() {
  try {
    const raw = sessionStorage.getItem(REACTIONS_KEY);
    const o = JSON.parse(raw || '{}');
    return typeof o === 'object' && o ? o : {};
  } catch {
    return {};
  }
}

function playPing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 720;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.09);
    if (typeof ctx.close === 'function') ctx.close();
  } catch {
    // ignore
  }
}

export default function Chatbot() {
  const {
    messages,
    isTyping,
    isOpen,
    unreadCount,
    sendMessage,
    openChat,
    closeAndReset,
    clearChat,
    quickReplies
  } = useChatbot();

  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [reactions, setReactions] = useState(loadReactions);
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SOUND_PREF_KEY) === 'on';
    } catch {
      return false;
    }
  });

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const prevLenRef = useRef(messages.length);

  const showWelcomeChips =
    messages.length === 1 && messages[0]?.type === 'bot' && messages[0]?.showQuickReplies;

  const lastBotWithFollowups = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.type === 'bot' && Array.isArray(m.followups) && m.followups.length) return m;
    }
    return null;
  }, [messages]);

  const typeahead = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (q.length < 1) return [];
    return quickReplies
      .filter((label) => label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [input, quickReplies]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen, minimized, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, minimized]);

  useEffect(() => {
    const grew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;
    if (!grew || !soundOn) return;
    const last = messages[messages.length - 1];
    if (last?.type === 'bot') playPing();
  }, [messages, soundOn]);

  const setReaction = (id, value) => {
    setReactions((prev) => {
      const next = { ...prev };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      try {
        sessionStorage.setItem(REACTIONS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSound = () => {
    setSoundOn((on) => {
      const next = !on;
      try {
        localStorage.setItem(SOUND_PREF_KEY, next ? 'on' : 'off');
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || isTyping) return;
    sendMessage(t);
    setInput('');
  };

  const pickTypeahead = (label) => {
    sendMessage(label);
    setInput('');
  };

  return (
    <div className="fixed bottom-0 right-0 z-[9999] flex flex-col items-end p-4 max-md:p-3">
      <div
        className={`mb-3 w-[350px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 transition-all duration-300 ease-out max-md:mb-2 max-md:w-[calc(100vw-1.5rem)] ${
          isOpen
            ? 'pointer-events-auto nova-chat-panel-enter translate-y-0 opacity-100'
            : 'pointer-events-none h-0 max-h-0 translate-y-3 opacity-0'
        } ${isOpen && minimized ? 'flex max-h-14 flex-col' : ''} ${isOpen && !minimized ? 'flex h-[400px] flex-col' : ''}`}
        aria-hidden={!isOpen}
      >
        {isOpen && (
          <>
            <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-[#fafaf8] px-3 py-2.5">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-[#0a0a0a]">Nova Shop Support</h2>
                <p className="text-xs text-gray-500">Roman Urdu & English — instant replies</p>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={toggleSound}
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-200/80"
                  aria-label={soundOn ? 'Mute reply sound' : 'Enable reply sound'}
                  title={soundOn ? 'Sound on' : 'Sound off (default)'}
                >
                  {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200/80"
                  title="Clear conversation (stay open)"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized((m) => !m)}
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-200/80"
                  aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
                >
                  <Minimize2 size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeAndReset();
                    setMinimized(false);
                  }}
                  className="rounded-md p-2 text-gray-600 hover:bg-gray-200/80"
                  aria-label="Close and reset chat"
                  title="Close — new session next time"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </header>

            {!minimized && (
              <>
                <div
                  ref={listRef}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-3 py-3"
                  role="log"
                  aria-live="polite"
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`group nova-chat-msg-enter flex flex-col gap-1 ${m.type === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        title={formatMessageTime(m.timestamp)}
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          m.type === 'user'
                            ? 'bg-[#0a0a0a] text-[#fafaf8]'
                            : 'bg-[#F3F4F6] text-[#0a0a0a]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        {m.type === 'bot' && typeof m.confidence === 'number' && m.confidence > 0 && m.confidence < 0.5 && (
                          <p className="mt-1.5 border-t border-gray-200/80 pt-1.5 text-[10px] text-gray-500">
                            Low match confidence — double-check with WhatsApp if needed.
                          </p>
                        )}
                        {m.type === 'bot' && (
                          <div className="mt-2 flex items-center gap-1 border-t border-gray-200/60 pt-2 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
                            <button
                              type="button"
                              className={`rounded p-1 hover:bg-white/80 ${reactions[m.id] === 'up' ? 'text-emerald-600' : 'text-gray-500'}`}
                              aria-label="Helpful"
                              onClick={() => setReaction(m.id, 'up')}
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={`rounded p-1 hover:bg-white/80 ${reactions[m.id] === 'down' ? 'text-red-600' : 'text-gray-500'}`}
                              aria-label="Not helpful"
                              onClick={() => setReaction(m.id, 'down')}
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="invisible px-1 text-[10px] text-gray-400 group-hover:visible max-md:visible">
                        {formatMessageTime(m.timestamp)}
                      </span>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5 rounded-2xl bg-[#F3F4F6] px-4 py-3">
                        <span className="nova-chat-typing-dot" />
                        <span className="nova-chat-typing-dot" />
                        <span className="nova-chat-typing-dot" />
                      </div>
                      <span className="px-1 text-[10px] text-gray-400">Typing…</span>
                    </div>
                  )}
                </div>

                {showWelcomeChips && (
                  <div className="shrink-0 border-t border-gray-100 bg-white px-3 pb-2 pt-1">
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">Quick topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickReplies.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => sendMessage(label)}
                          disabled={isTyping}
                          className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-[#0a0a0a] transition hover:border-[#0a0a0a] hover:bg-white disabled:opacity-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isTyping && lastBotWithFollowups && (
                  <div className="shrink-0 border-t border-dashed border-gray-200 bg-[#fafaf8] px-3 py-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Related</p>
                    <div className="flex flex-wrap gap-1.5">
                      {lastBotWithFollowups.followups.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => sendMessage(label)}
                          className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-[#0a0a0a] transition hover:border-[#0a0a0a]"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="relative flex shrink-0 gap-2 border-t border-gray-100 bg-[#fafaf8] p-2"
                >
                  {typeahead.length > 0 && (
                    <ul
                      className="absolute bottom-full left-2 right-2 z-10 mb-1 max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-md"
                      role="listbox"
                    >
                      {typeahead.map((label) => (
                        <li key={label}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-gray-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickTypeahead(label)}
                          >
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Urdu / English likhein…"
                    disabled={isTyping}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#0a0a0a] outline-none ring-0 placeholder:text-gray-400 focus:border-[#0a0a0a]"
                    aria-label="Message"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !input.trim()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1a1a2e] disabled:opacity-40"
                  >
                    <Send size={16} aria-hidden />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>

      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            openChat();
            setMinimized(false);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0a0a0a] text-[#fafaf8] shadow-lg transition hover:bg-[#1a1a2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a84b] focus-visible:ring-offset-2"
          aria-label="Open Nova Shop support chat"
        >
          <MessageCircle size={24} aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#c8a84b] px-1 text-[11px] font-bold text-[#0a0a0a]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
