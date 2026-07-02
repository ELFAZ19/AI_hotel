/**
 * ChatHistoryPanel.jsx
 * Slide-in panel listing past chat sessions for authenticated users.
 * Clicking a session loads its messages into the main chat window.
 */

import { useState, useEffect } from 'react';
import { History, X, MessageSquare, Loader, ChevronRight } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { getChatSessions, getSessionMessages } from '../../services/chatService';
import { useAuthStore } from '../../store/authStore';

export default function ChatHistoryPanel({ onClose }) {
  const { user } = useAuthStore();
  const { setSessionId, messages: currentMessages } = useChatStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState(null);

  useEffect(() => {
    if (!user) return;
    getChatSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleLoadSession = async (sessionId) => {
    setLoadingSession(sessionId);
    try {
      const msgs = await getSessionMessages(sessionId);
      // Map DB format to store format
      const mapped = msgs
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          id: crypto.randomUUID(),
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        }));

      // Replace messages in store
      useChatStore.setState({ messages: mapped, sessionId });
      onClose();
    } catch {
      // silently fail
    } finally {
      setLoadingSession(null);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-700 text-white flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <History size={16} />
          <span className="text-sm font-semibold">Chat History</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-amber-600 rounded-lg">
          <X size={16} />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={20} className="animate-spin text-amber-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No past conversations</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleLoadSession(session.id)}
                disabled={loadingSession === session.id}
                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {session.title || 'Untitled conversation'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(session.updated_at).toLocaleDateString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {loadingSession === session.id ? (
                    <Loader size={14} className="animate-spin text-amber-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-amber-500 flex-shrink-0 transition-colors" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
