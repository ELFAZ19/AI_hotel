/**
 * ChatWidget.jsx
 * The floating chat bubble that sits fixed in the bottom-right corner.
 * Click to open/close the ChatWindow modal.
 */

import { useState } from 'react';
import { MessageCircle, X, LogIn, UserPlus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
  const { isOpen, toggleChat, closeChat } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // When unauthenticated, show auth prompt first; user can dismiss to chat as guest
  const [guestMode, setGuestMode] = useState(false);
  const showAuthPrompt = isOpen && !user && !guestMode;
  const showChat      = isOpen && (user || guestMode);
  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes chat-bounce {
          0%, 100% { transform: translateY(0); }
          30%       { transform: translateY(-10px); }
          60%       { transform: translateY(-5px); }
        }
        @keyframes chat-glow-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes chat-wave {
          0%   { transform: rotate(0deg);   }
          15%  { transform: rotate(18deg);  }
          30%  { transform: rotate(-12deg); }
          45%  { transform: rotate(14deg);  }
          60%  { transform: rotate(-8deg);  }
          75%  { transform: rotate(10deg);  }
          100% { transform: rotate(0deg);   }
        }
        .chat-btn-bounce {
          animation: chat-bounce 1.8s ease-in-out infinite;
        }
        .chat-btn-bounce:hover {
          animation: none;
          transform: scale(1.1);
        }
        .chat-glow-ring {
          animation: chat-glow-ring 1.8s ease-out infinite;
        }
        .chat-wave-hand {
          display: inline-block;
          transform-origin: 70% 80%;
          animation: chat-wave 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Auth prompt panel — shown when not logged in */}
      <div
        className={`
          fixed bottom-24 right-4 z-[9999]
          w-[360px] max-w-[calc(100vw-2rem)]
          rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${showAuthPrompt
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        aria-hidden={!showAuthPrompt}
        role="dialog"
        aria-label="Sign in to chat"
      >
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-amber-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-sm text-white">
                A
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Adane Concierge</p>
                <p className="text-xs text-amber-200 leading-tight">AI Hotel Assistant</p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="p-1.5 hover:bg-amber-600 rounded-lg transition-colors text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={30} className="text-amber-600" />
            </div>

            <h3 className="text-gray-900 font-semibold text-base mb-1">
              Chat with Adane Concierge
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Sign in for a personalized experience — save conversations, make bookings, and manage reservations.
            </p>

            {/* Auth buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { closeChat(); navigate('/login'); }}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                <LogIn size={16} />
                Log In
              </button>
              <button
                onClick={() => { closeChat(); navigate('/register'); }}
                className="w-full flex items-center justify-center gap-2 border border-amber-600 text-amber-700 hover:bg-amber-50 font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                <UserPlus size={16} />
                Create an Account
              </button>
            </div>

            {/* Guest option */}
            <button
              onClick={() => setGuestMode(true)}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              Continue as guest (limited features)
            </button>
          </div>
        </div>
      </div>

      {/* Chat window panel — shown when authenticated or guest mode */}
      <div
        className={`
          fixed bottom-24 right-4 z-[9999]
          w-[360px] max-w-[calc(100vw-2rem)]
          h-[580px] max-h-[calc(100vh-8rem)]
          rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${showChat
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        aria-hidden={!showChat}
        role="dialog"
        aria-label="AI Hotel Concierge Chat"
      >
        <ChatWindow onClose={closeChat} />
      </div>

      {/* Floating bubble button */}
      <div className="fixed bottom-6 right-4 z-[9999] flex flex-col items-center gap-2">

        {/* "Need help?" tooltip — only when closed */}
        {!isOpen && (
          <span className="
            bg-gray-900 text-white text-xs font-medium
            px-3 py-1.5 rounded-full shadow-md
            whitespace-nowrap
            animate-pulse
          ">
            Need help? <span className="chat-wave-hand">👋</span>
          </span>
        )}

        {/* Button wrapper (handles bounce) */}
        <div className={`relative ${!isOpen ? 'chat-btn-bounce' : ''}`}>

          {/* Glow rings — only when closed */}
          {!isOpen && (
            <>
              <span className="chat-glow-ring absolute inset-0 rounded-full bg-amber-400 pointer-events-none" />
              <span
                className="chat-glow-ring absolute inset-0 rounded-full bg-amber-400 pointer-events-none"
                style={{ animationDelay: '0.6s' }}
              />
            </>
          )}

          <button
            onClick={() => { if (isOpen) setGuestMode(false); toggleChat(); }}
            className={`
              relative w-14 h-14 rounded-full shadow-lg
              flex items-center justify-center
              transition-all duration-300 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
              ${isOpen
                ? 'bg-gray-700 hover:bg-gray-800'
                : 'bg-amber-600 hover:bg-amber-700'}
            `}
            aria-label={isOpen ? 'Close chat' : 'Open AI concierge chat'}
          >
            {isOpen ? (
              <X size={22} className="text-white" />
            ) : (
              <MessageCircle size={22} className="text-white" />
            )}

            {/* Unread online dot (only when closed) */}
            {!isOpen && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
