// BRITZMEDI AI Chatbot Component
import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessageBody from './ChatMessageBody';
import ChatLeadForm from './ChatLeadForm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Keywords that mark a conversation as a distributor enquiry rather than a general
// product question. Distribution/partnership is the single biggest topic in the
// chat log (9 of 20 conversations), so the lead is tagged accordingly.
const DISTRIBUTOR_HINT = /(distribut|dealer|reseller|partner|agent|oem|odm|총판|대리점|유통|파트너|distribuidor|distributeur)/i;

interface ChatbotProps {
  productContext?: string;
  pageContext?: string;
}

export default function Chatbot({ productContext, pageContext }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm the BRITZMEDI assistant. How can I help you today? Ask me about our products, certifications, or partnership opportunities.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requireVerification, setRequireVerification] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Store height in ref — never causes re-render, never recalculated
  const capturedHeightRef = useRef<number>(0);

  // Lock/unlock body scroll for mobile
  const lockBodyScroll = useCallback((lock: boolean) => {
    if (typeof document === 'undefined') return;
    if (lock) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, []);

  // Handle open/close: set height ONCE via DOM, lock body scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < 640;

    if (isOpen && !isMinimized && mobile) {
      // Capture height ONCE — store in ref, apply directly to DOM
      if (capturedHeightRef.current === 0) {
        capturedHeightRef.current = Math.round(window.innerHeight * 0.8);
      }
      // Apply height directly to DOM element — no state, no re-render
      if (chatContainerRef.current) {
        const h = capturedHeightRef.current + 'px';
        chatContainerRef.current.style.height = h;
        chatContainerRef.current.style.maxHeight = h;
      }
      lockBodyScroll(true);
    } else if (!isOpen) {
      capturedHeightRef.current = 0; // Reset for next open
      lockBodyScroll(false);
    } else if (isMinimized) {
      lockBodyScroll(false);
    }
    return () => {
      if (!isOpen) lockBodyScroll(false);
    };
  }, [isOpen, isMinimized, lockBodyScroll]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (messageOverride?: string, verificationToken?: string) => {
    const messageToSend = messageOverride || inputValue.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    // Always show the visitor's own question, including quick-action and suggestion
    // clicks. Skipping it (the old `if (!messageOverride)` guard) meant the answer
    // appeared with no question above it, AND the question never entered `messages`
    // — so it was also missing from the history sent to Claude on the next turn.
    setMessages(prev => [...prev, userMessage]);
    if (!messageOverride) setInputValue('');
    setIsLoading(true);

    try {
      // Never send more than the last 20 messages (mirrors the server-side cap)
      const historyData = messages.slice(-20).map(m => ({
        role: String(m.role),
        content: String(m.content)
      }));

      const requestBody = {
        message: String(userMessage.content),
        history: historyData,
        context: {
          product: productContext ? String(productContext) : undefined,
          page: pageContext ? String(pageContext) : undefined
        },
        sessionId: chatSessionId || undefined,
        conversationId: conversationId || undefined,
        verificationToken: verificationToken ? String(verificationToken) : undefined
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.status === 429) {
        const retryAfter = data.retryAfter || 60;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${data.message} (Please wait ${retryAfter} seconds)`,
          timestamp: new Date()
        }]);
        setSuggestions([]);
        return;
      }

      if (data.requireVerification) {
        setPendingMessage(userMessage.content);
        setRequireVerification(true);
        setSuggestions([]);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
        return;
      }

      // Track session and conversation IDs from server
      if (data.sessionId) setChatSessionId(data.sessionId);
      if (data.conversationId) setConversationId(data.conversationId);

      if (data.fallback) {
        console.warn('[Chatbot] Using fallback response (AI unavailable)', data.error || '');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Server flags commercial intent → offer the inline lead form (once).
      if (data.showLeadForm && !leadCaptured) {
        setShowLeadForm(true);
      }

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('[Chatbot] Fetch error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again or contact us at sh.lee@britzmedi.com",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = useCallback(() => {
    setRequireVerification(false);
    if (pendingMessage) {
      sendMessage(pendingMessage, 'human-verified');
      setPendingMessage(null);
    }
  }, [pendingMessage]);

  // Mark the conversation as converted.
  //
  // This replaces a handler that listened for clicks on `<a href*="/contact">` but
  // was never bound to any element — and could not have worked anyway, because
  // messages were rendered as plain text so no anchor ever existed. That is why
  // lead_converted was 0 for all 20 stored conversations: the signal was
  // unreachable, not absent.
  const markConverted = useCallback(() => {
    if (!conversationId) return;
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '_lead_converted', sessionId: chatSessionId, conversationId, leadConverted: true })
    }).catch(() => {});
  }, [conversationId, chatSessionId]);

  // Fired by ChatMessageBody for any link inside a bot answer.
  const handleLinkClick = useCallback((href: string) => {
    if (href.includes('/contact') || href.startsWith('mailto:')) markConverted();
  }, [markConverted]);

  const handleLeadSubmitted = useCallback(() => {
    setLeadCaptured(true);
    setShowLeadForm(false);
    markConverted();
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Thanks — your details are with our team now. Someone will get back to you by email, usually within 1-2 business days. Anything else I can help with in the meantime?",
      timestamp: new Date(),
    }]);
  }, [markConverted]);

  // Last few turns, attached to the lead so sales sees what was actually asked.
  const buildTranscript = useCallback(() => {
    return messages
      .slice(-8)
      .map(m => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
  }, [messages]);

  const inquiryType: 'distributor' | 'product_info' = messages.some(
    m => m.role === 'user' && DISTRIBUTOR_HINT.test(m.content)
  ) ? 'distributor' : 'product_info';

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: 'Products', message: 'Tell me about your products' },
    { label: 'FDA Status', message: 'What FDA certifications do you have?' },
    { label: 'Distributor', message: 'How can I become a distributor?' },
    { label: 'Contact', message: 'How can I contact your sales team?' }
  ];

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 flex items-center justify-center transition-all duration-300 group"
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>
    );
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998] sm:hidden"
        onClick={handleClose}
      />

      {/*
        Mobile: height/maxHeight set via DOM ref (never re-renders).
        Desktop: sm:h-[32rem] from Tailwind.
        No inline style for height — it's all done via ref.
      */}
      <div
        ref={chatContainerRef}
        className={`fixed z-[9999] bg-white flex flex-col ${
          isMinimized
            ? 'bottom-6 right-6 w-80 h-16 rounded-2xl shadow-2xl border border-slate-200'
            : [
                'inset-x-0 bottom-0 rounded-t-2xl shadow-2xl',
                'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[32rem] sm:rounded-2xl sm:border sm:border-slate-200'
              ].join(' ')
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-primary-600 to-primary-700 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm sm:text-base">BRITZMEDI Assistant</h3>
              <p className="text-xs text-white/80">AI-powered support</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isMinimized && (
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                aria-label="Minimize chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {isMinimized && (
              <button
                onClick={() => setIsMinimized(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Expand chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 min-h-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <ChatMessageBody content={message.content} onLinkClick={handleLinkClick} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Inline lead capture — appears when the visitor shows buying intent */}
              {showLeadForm && !leadCaptured && !isLoading && (
                <ChatLeadForm
                  transcript={buildTranscript()}
                  inquiryType={inquiryType}
                  onSubmitted={handleLeadSubmitted}
                  onDismiss={() => setShowLeadForm(false)}
                />
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Verification button — OUTSIDE scroll area for reliable touch */}
            {requireVerification && !isLoading && (
              <div className="px-4 py-3 border-t border-slate-100 shrink-0 bg-white">
                <button
                  onClick={handleVerification}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleVerification();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl active:bg-primary-200 transition-colors cursor-pointer select-none"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-primary-700">
                    I'm not a robot
                  </span>
                </button>
              </div>
            )}

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 shrink-0">
                <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(action.message)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Suggestions.
                Hidden while the lead form is up: the form is the conversion action and
                the chips compete with it for a ~320px column. It matters most exactly
                when the form shows — the distributor chips ("What regions need
                distributors?", "What support do you offer partners?", "What are the
                partnership requirements?") have no answer in the knowledge base, so
                they walk a ready-to-convert visitor into three "I don't know" replies. */}
            {suggestions.length > 0 && messages.length > 1 && !isLoading && !requireVerification && !(showLeadForm && !leadCaptured) && (
              <div className="px-4 pb-2 shrink-0">
                <p className="text-xs text-slate-500 mb-2">You might also ask:</p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSuggestions([]);
                        sendMessage(suggestion);
                      }}
                      className="px-3 py-2 text-xs text-left font-medium bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors border border-primary-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input - fixed at bottom */}
            <div className="p-3 sm:p-4 border-t border-slate-200 shrink-0 bg-white rounded-b-none sm:rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-100 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 text-slate-800 placeholder-slate-400 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="p-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Powered by Claude AI
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
