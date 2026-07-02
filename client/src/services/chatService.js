/**
 * chatService.js
 * API calls for the AI chat system.
 */

import axiosInstance from '../lib/axios';

/**
 * Send a chat message (non-streaming).
 * @param {object} params
 * @param {string} params.message
 * @param {string|null} params.sessionId
 * @param {string|null} params.guestToken
 */
export const sendChatMessage = async ({ message, sessionId, guestToken }) => {
  const { data } = await axiosInstance.post('/ai/chat', {
    message,
    sessionId,
    guestToken,
  });
  return data.data; // { sessionId, message, toolsUsed }
};

/**
 * Send a chat message with streaming via SSE.
 * Returns a cleanup function to abort the stream.
 *
 * @param {object} params
 * @param {Function} params.onChunk     - called with each text chunk string
 * @param {Function} params.onToolCall  - called when a tool is invoked
 * @param {Function} params.onDone      - called with { sessionId } when complete
 * @param {Function} params.onError     - called with error message string
 */
export const sendChatMessageStream = async ({
  message,
  sessionId,
  guestToken,
  token,
  onChunk,
  onToolCall,
  onDone,
  onError,
}) => {
  const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const normalised = apiBaseURL.endsWith('/api')
    ? apiBaseURL
    : `${apiBaseURL.replace(/\/$/, '')}/api`;

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const abortController = new AbortController();

  try {
    const response = await fetch(`${normalised}/ai/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sessionId, guestToken }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      onError?.(errText || 'Stream request failed');
      return () => {};
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        let currentEvent = null;

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              switch (currentEvent) {
                case 'chunk': onChunk?.(parsed.text); break;
                case 'tool':  onToolCall?.(parsed.name); break;
                case 'done':  onDone?.(parsed); break;
                case 'error': onError?.(parsed.message); break;
                default:
                  // Fallback heuristic if event line was missed
                  if (parsed.text !== undefined) onChunk?.(parsed.text);
                  else if (parsed.name !== undefined) onToolCall?.(parsed.name);
                  else if (parsed.sessionId !== undefined) onDone?.(parsed);
                  else if (parsed.message !== undefined) onError?.(parsed.message);
              }
              currentEvent = null; // reset after consuming data
            } catch {
              // ignore malformed SSE lines
            }
          } else if (line === '') {
            currentEvent = null; // blank line = end of event block
          }
        }
      }
    };

    pump().catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err.message);
      }
    });
  } catch (err) {
    if (err.name !== 'AbortError') {
      onError?.(err.message);
    }
  }

  return () => abortController.abort();
};

/**
 * Load all chat sessions for the authenticated user.
 */
export const getChatSessions = async () => {
  const { data } = await axiosInstance.get('/ai/sessions');
  return data.data;
};

/**
 * Load messages for a session.
 */
export const getSessionMessages = async (sessionId) => {
  const { data } = await axiosInstance.get(`/ai/sessions/${sessionId}/messages`);
  return data.data;
};
