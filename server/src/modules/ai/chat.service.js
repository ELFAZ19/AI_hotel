/**
 * chat.service.js
 * Manages chat sessions and message persistence.
 */

const { pool } = require('../../config/db');

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Finds or creates a chat session.
 * - Authenticated users: keyed by userId + sessionId
 * - Guests: keyed by guestToken + sessionId
 */
const getOrCreateSession = async ({ sessionId, userId, guestToken }) => {
  if (sessionId) {
    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE id = $1',
      [sessionId]
    );
    if (result.rows[0]) return result.rows[0];
  }

  // Create new session
  const result = await pool.query(
    `INSERT INTO chat_sessions (user_id, guest_token)
     VALUES ($1, $2) RETURNING *`,
    [userId || null, guestToken || null]
  );
  return result.rows[0];
};

const updateSessionTitle = async (sessionId, title) => {
  await pool.query(
    `UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
    [title.slice(0, 255), sessionId]
  );
};

const getUserSessions = async (userId) => {
  const result = await pool.query(
    `SELECT id, title, created_at, updated_at
     FROM chat_sessions WHERE user_id = $1
     ORDER BY updated_at DESC LIMIT 20`,
    [userId]
  );
  return result.rows;
};

// ---------------------------------------------------------------------------
// Message storage
// ---------------------------------------------------------------------------

/**
 * Save a single message to the DB.
 * @param {object} msg  { sessionId, role, content, toolCalls?, toolName?, toolResult? }
 */
const saveMessage = async ({ sessionId, role, content, toolCalls = null, toolName = null, toolResult = null }) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, tool_calls, tool_name, tool_result)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      sessionId,
      role,
      content,
      toolCalls ? JSON.stringify(toolCalls) : null,
      toolName || null,
      toolResult ? JSON.stringify(toolResult) : null,
    ]
  );
  return result.rows[0].id;
};

/**
 * Load the last N messages for a session (for context window).
 */
const getSessionMessages = async (sessionId, limit = 20) => {
  const result = await pool.query(
    `SELECT role, content, tool_calls, tool_name, tool_result, created_at
     FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sessionId, limit]
  );
  // Return in chronological order
  return result.rows.reverse();
};

module.exports = {
  getOrCreateSession,
  updateSessionTitle,
  getUserSessions,
  saveMessage,
  getSessionMessages,
};
