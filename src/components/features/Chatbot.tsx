// BRITZMEDI AI Chatbot Component
import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if mobile viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

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

  // Handle open/close with body scroll lock on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < 640;
    if (isOpen && !isMinimized && mobile) {
      lockBodyScroll(true);
    } else {
      lockBodyScroll(false);
    }
    return () => lockBodyScroll(false);
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

    if (!messageOverride) {
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const historyData = messages.slice(-10).map(m => ({
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

      if (data.fallback) {
        console.warn('[Chatbot] Using fallback response (AI unavailable)', data.error || '');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('[Chatbot] Fetch error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again or contact us at contact@britzmedi.co.kr",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setRequireVerification(false);
    if (pendingMessage) {
      await sendMessage(pendingMessage, 'human-verified');
      setPendingMessage(null);
    }
  };

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

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

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

      <div
        className={`fixed z-[9999] bg-white flex flex-col transition-all duration-300 ${
          isMinimized
            ? 'bottom-6 right-6 w-80 h-16 rounded-2xl shadow-2xl border border-slate-200'
            : [
                // Mobile: bottom sheet
                'inset-x-0 bottom-0 h-[80vh] rounded-t-2xl shadow-2xl',
                // Desktop: floating popup
                'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[32rem] sm:rounded-2xl sm:border sm:border-slate-200'
              ].join(' ')
        }`}
        style={isMinimized ? undefined : { maxHeight: 'calc(100dvh - 1rem)' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-primary-600 to-primary-700 shrink-0 ${
          isMinimized ? 'rounded-t-2xl' : 'rounded-t-2xl'
        }`}>
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
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

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

              {requireVerification && !isLoading && (
                <div className="flex justify-center">
                  <button
                    onClick={handleVerification}
                    className="flex items-center gap-2 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors"
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

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 shrink-0">
                <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.message)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Suggestions */}
            {suggestions.length > 0 && messages.length > 1 && !isLoading && !requireVerification && (
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
