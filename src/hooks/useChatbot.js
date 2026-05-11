import { useState, useCallback, useRef, useEffect } from 'react';
import { getResponse, getQuickReplies } from '../utils/chatbotUtils';

function createWelcomeMessage() {
  return {
    id: `welcome_${Date.now()}`,
    type: 'bot',
    text: "Assalam o Alaikum! 👋 Nova Shop mein khush amdeed!\n\nMein aapka virtual assistant hoon. Kaise help kar sakta hoon?",
    timestamp: new Date(),
    showQuickReplies: true
  };
}

export const useChatbot = () => {
  const [messages, setMessages] = useState(() => [createWelcomeMessage()]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const conversationContext = useRef({ lastTag: null, messageCount: 0 });
  const isOpenRef = useRef(isOpen);
  const replyTimerRef = useRef(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(
    () => () => {
      if (replyTimerRef.current) {
        window.clearTimeout(replyTimerRef.current);
        replyTimerRef.current = null;
      }
    },
    []
  );

  const sendMessage = useCallback((userText) => {
    if (!userText.trim()) return;

    conversationContext.current.messageCount += 1;

    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
    }

    const delay = 600 + Math.random() * 400;

    replyTimerRef.current = window.setTimeout(() => {
      replyTimerRef.current = null;
      const lastTag = conversationContext.current.lastTag;
      const result = getResponse(userText, { lastTag });
      conversationContext.current.lastTag = result.tag;

      const botMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot',
        text: result.text,
        timestamp: new Date(),
        followups: result.followups || [],
        confidence: result.confidence
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

      if (!isOpenRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
    }, delay);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setUnreadCount(0);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeAndReset = useCallback(() => {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    setIsTyping(false);
    setMessages([createWelcomeMessage()]);
    conversationContext.current = { lastTag: null, messageCount: 0 };
    setIsOpen(false);
    setUnreadCount(0);
  }, []);

  const clearChat = useCallback(() => {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    setIsTyping(false);
    setMessages([createWelcomeMessage()]);
    conversationContext.current = { lastTag: null, messageCount: 0 };
  }, []);

  return {
    messages,
    isTyping,
    isOpen,
    unreadCount,
    sendMessage,
    toggleChat,
    openChat,
    closeAndReset,
    clearChat,
    quickReplies: getQuickReplies()
  };
};
