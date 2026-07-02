/**
 * ChatWidget.jsx
 * The floating chat bubble that sits fixed in the bottom-right corner.
 * Click to open/close the ChatWindow modal.
 */

import { MessageCircle, X } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
  const { isOpen, toggleChat, closeChat } = useChatStore();

  return (
    <>
      {/* Chat window panel */}
      <div
        className={`
          fixed bottom-24 right-4 z-50
          w-[360px] max-w-[calc(100vw-2rem)]
          h-[580px] max-h-[calc(100vh-8rem)]
          rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="AI Hotel Concierge Chat"
      >
        <ChatWindow onClose={closeChat} />
      </div>

      {/* Floating bubble button */}
      <button
        onClick={toggleChat}
        className={`
          fixed bottom-6 right-4 z-50
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
          ${isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
            : 'bg-amber-600 hover:bg-amber-700'}
        `}
        aria-label={isOpen ? 'Close chat' : 'Open AI concierge chat'}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}

        {/* Unread pulse dot (only when closed) */}
        {!isOpen && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
}
