/**
 * chatStore.js
 * Manages AI chat state: sessions, messages, streaming, and guest token.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export const useChatStore = create(
  persist(
    (set, get) => ({
      // Stable guest token so guests keep chat context across page reloads
      guestToken: null,
      // Current active session ID
      sessionId: null,
      // All messages in the current session [ { role, content, id, timestamp } ]
      messages: [],
      // UI state
      isOpen: false,
      isLoading: false,
      isStreaming: false,
      streamingText: '',
      error: null,

      // -----------------------------------------------------------------------
      // Actions
      // -----------------------------------------------------------------------

      ensureGuestToken: () => {
        if (!get().guestToken) {
          set({ guestToken: uuidv4() });
        }
      },

      toggleChat: () => set((s) => ({ isOpen: !s.isOpen, error: null })),
      openChat: () => set({ isOpen: true, error: null }),
      closeChat: () => set({ isOpen: false }),

      startNewSession: () =>
        set({ sessionId: null, messages: [], streamingText: '', error: null }),

      setSessionId: (id) => set({ sessionId: id }),

      addMessage: (role, content, extra = {}) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { id: uuidv4(), role, content, timestamp: new Date().toISOString(), ...extra },
          ],
        })),

      appendStreamChunk: (text) =>
        set((s) => ({ streamingText: s.streamingText + text })),

      commitStreamedMessage: (extra = {}) => {
        const { streamingText } = get();
        if (!streamingText) return;
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: uuidv4(),
              role: 'assistant',
              content: streamingText,
              timestamp: new Date().toISOString(),
              ...extra,
            },
          ],
          streamingText: '',
          isStreaming: false,
        }));
      },

      setLoading: (val) => set({ isLoading: val }),
      setStreaming: (val) => set({ isStreaming: val }),
      setError: (msg) => set({ error: msg }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'chat-storage',
      // Only persist what we want across page reloads
      partialize: (state) => ({
        guestToken: state.guestToken,
        sessionId: state.sessionId,
        messages: state.messages.slice(-30), // keep last 30 messages
      }),
    }
  )
);
