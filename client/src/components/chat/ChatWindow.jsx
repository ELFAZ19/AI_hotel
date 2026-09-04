/**
 * ChatWindow.jsx
 * The main chat panel — message list, input, and streaming handling.
 * Uses SSE streaming by default; falls back to non-streaming gracefully.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Send, RotateCcw, History } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { sendChatMessageStream, sendChatMessage } from '../../services/chatService';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ChatPaymentButton from './ChatPaymentButton';
import ChatHistoryPanel from './ChatHistoryPanel';
import SuggestedQuestions from './SuggestedQuestions';

// Detect payment link in assistant text (matches Chapa checkout URLs)
const PAYMENT_URL_REGEX = /https?:\/\/(?:checkout\.chapa\.co|api\.chapa\.co)\/[^\s)">]+/i;

export default function ChatWindow({ onClose }) {
  const {
    messages,
    sessionId,
    guestToken,
    isLoading,
    isStreaming,
    streamingText,
    error,
    ensureGuestToken,
    addMessage,
    appendStreamChunk,
    commitStreamedMessage,
    setLoading,
    setStreaming,
    setError,
    setSessionId,
    clearError,
    startNewSession,
  } = useChatStore();

  const { token: authToken, user } = useAuthStore();
  const [input, setInput] = useState('');
  const [activeToolName, setActiveToolName] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortStreamRef = useRef(null);

  // ----- Scroll to bottom on new messages -----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // ----- Ensure guest token on mount -----
  useEffect(() => {
    if (!user) ensureGuestToken();
  }, [user, ensureGuestToken]);

  // ----- Show welcome message if no messages yet -----
  useEffect(() => {
    if (messages.length === 0) {
      // Add a synthetic welcome message (not persisted to DB)
      useChatStore.getState().addMessage(
        'assistant',
        `Welcome to **Adane International Hotel** 🏨\n\nI'm Adane, your AI concierge. I can help you with:\n- 🛏️ Room availability & booking\n- 🍽️ Restaurant reservations\n- 🎪 Event hall bookings\n- 💳 Payments & confirmations\n- ℹ️ Hotel information & policies\n\nHow can I assist you today?`,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Send message -----
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || isStreaming) return;

    clearError();
    setInput('');
    addMessage('user', text);
    setStreaming(true);
    setActiveToolName(null);

    // Build params
    const params = {
      message: text,
      sessionId,
      guestToken: user ? null : guestToken,
      token: authToken,
    };

    // Cancel any ongoing stream
    abortStreamRef.current?.();
    abortStreamRef.current = null;

    let streamWorked = false;
    let streamPaymentData = null;

    const abort = await sendChatMessageStream({
      ...params,
      onChunk: (chunk) => {
        streamWorked = true;
        setActiveToolName(null);
        appendStreamChunk(chunk);
      },
      onToolCall: (name) => {
        setActiveToolName(name);
      },
      onPayment: (paymentData) => {
        streamPaymentData = paymentData;
      },
      onDone: (doneData) => {
        const sid = doneData?.sessionId;
        if (sid && !sessionId) setSessionId(sid);
        const pUrl = doneData?.paymentUrl || streamPaymentData?.url;
        const pAmount = doneData?.paymentAmount || streamPaymentData?.amount;
        commitStreamedMessage(pUrl ? { paymentUrl: pUrl, paymentAmount: pAmount } : {});
        setStreaming(false);
        setActiveToolName(null);
      },
      onError: async (errMsg) => {
        if (!streamWorked) {
          // Fallback to non-streaming
          try {
            const result = await sendChatMessage(params);
            if (!sessionId && result.sessionId) setSessionId(result.sessionId);
            addMessage('assistant', result.message, {
              paymentUrl: result.paymentUrl,
              paymentAmount: result.paymentAmount,
            });
          } catch {
            setError('Failed to get a response. Please try again.');
          }
        } else {
          setError('Stream interrupted.');
          const pUrl = streamPaymentData?.url;
          const pAmount = streamPaymentData?.amount;
          commitStreamedMessage(pUrl ? { paymentUrl: pUrl, paymentAmount: pAmount } : {});
        }
        setStreaming(false);
        setActiveToolName(null);
      },
    });

    abortStreamRef.current = abort;
  }, [
    input, isLoading, isStreaming, sessionId, guestToken, authToken,
    user, clearError, addMessage, appendStreamChunk, commitStreamedMessage,
    setStreaming, setError, setSessionId,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    abortStreamRef.current?.();
    abortStreamRef.current = null;
    startNewSession();
    setShowHistory(false);
  };

  const handleSuggestionClick = (question) => {
    setInput(question);
    // Trigger send on next tick so state is updated
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // ----- Extract payment URL from assistant messages -----
  const extractPaymentUrl = (text) => {
    const match = text?.match(PAYMENT_URL_REGEX);
    if (!match) return null;
    // Strip trailing punctuation like . , ; : ! ? )
    return match[0].replace(/[.,;:!?)]+$/, '');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative overflow-hidden rounded-2xl">
      {/* History panel (slides in over chat) */}
      {showHistory && (
        <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden">
          <ChatHistoryPanel onClose={() => setShowHistory(false)} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-700 text-white flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-sm">
            A
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Adane Concierge</p>
            <p className="text-xs text-amber-200 leading-tight">
              {user ? `Welcome, ${user.firstName}` : 'AI Hotel Assistant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="p-1.5 hover:bg-amber-600 rounded-lg transition-colors"
              title="Chat history"
            >
              <History size={15} />
            </button>
          )}
          <button
            onClick={handleNewChat}
            className="p-1.5 hover:bg-amber-600 rounded-lg transition-colors"
            title="New conversation"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-amber-600 rounded-lg transition-colors"
            title="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Login nudge for guests */}
      {!user && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs text-amber-800 flex items-center gap-1.5">
          <span>💡</span>
          <span>
            <a href="/login" className="font-semibold underline">Log in</a> to make bookings and payments.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatMessage
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
            {/* Payment button if a Chapa URL is found or metadata attached */}
            {msg.role === 'assistant' && (() => {
              const url = msg.paymentUrl || extractPaymentUrl(msg.content);
              return url ? <ChatPaymentButton url={url} amount={msg.paymentAmount} /> : null;
            })()}
          </div>
        ))}

        {/* Streaming text being typed */}
        {isStreaming && (
          streamingText ? (
            <ChatMessage role="assistant" content={streamingText} isStreaming />
          ) : (
            <TypingIndicator toolName={activeToolName} />
          )
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips — only visible when only the welcome message exists */}
      {messages.length <= 1 && !isStreaming && (
        <SuggestedQuestions onSelect={handleSuggestionClick} />
      )}

      {/* Input area */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-gray-200 bg-white rounded-b-2xl">        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isStreaming}
            placeholder="Ask me anything about the hotel..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 px-3 py-2 text-sm outline-none placeholder-gray-400 disabled:bg-gray-50 max-h-28 overflow-y-auto"
            style={{ minHeight: '40px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isStreaming}
            className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          AI responses may not be perfect. Verify important details.
        </p>
      </div>
    </div>
  );
}
